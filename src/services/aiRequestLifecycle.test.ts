import assert from "node:assert/strict";
import { test } from "node:test";

import OpenAI from "openai";

import {
  AIRequestSlot,
  createAIRequestId,
  collectOpenAIStream,
  collectUtoolsStream,
  runAICompletion,
  type AICompletionCallbacks,
  type AIRequestOptions,
} from "./aiRequestLifecycle";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });

  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function runSDK(
  fetch: typeof globalThis.fetch,
  callbacks: AICompletionCallbacks,
  options: AIRequestOptions = {},
) {
  const client = new OpenAI({ apiKey: "mock-only", fetch, maxRetries: 0 });

  return runAICompletion(
    (request, guarded) =>
      collectOpenAIStream(request, guarded, () =>
        client.chat.completions.create(
          { model: "mock", messages: [], stream: true },
          { signal: request.signal },
        ),
      ),
    callbacks,
    options,
  );
}

test("SDK: cancel before headers settles immediately and aborts fetch", async () => {
  const controller = new AbortController();
  const started = deferred<AbortSignal>();
  const response = deferred<Response>();
  let complete = 0;
  let errors = 0;
  const result = runSDK(
    async (_url, init) => {
      started.resolve(init!.signal!);

      return response.promise;
    },
    {
      onComplete: () => complete++,
      onError: () => errors++,
    },
    { signal: controller.signal },
  );
  const transportSignal = await started.promise;

  controller.abort();
  assert.equal(await result, false);
  assert.equal(transportSignal.aborted, true);
  response.reject(new Error("late rejection"));
  await tick();
  assert.equal(complete, 0);
  assert.equal(errors, 0);
});

test("pre-aborted requests never start", async () => {
  const controller = new AbortController();

  controller.abort();
  assert.equal(
    await runAICompletion(
      async () => {
        throw new Error("must not start");
      },
      {
        onStart: () => assert.fail("must not start"),
        onError: () => assert.fail("cancel is silent"),
      },
      { signal: controller.signal },
    ),
    false,
  );
});

test("SDK: stream abort is not mistaken for successful completion", async () => {
  const controller = new AbortController();
  const chunks: string[] = [];
  let transportSignal: AbortSignal | undefined;
  let complete = 0;
  const result = await runSDK(
    async (_url, init) => {
      transportSignal = init!.signal!;

      return new Response(
        new ReadableStream({
          start(stream) {
            stream.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
              ),
            );
            transportSignal!.addEventListener("abort", () =>
              stream.error(new DOMException("cancel", "AbortError")),
            );
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    },
    {
      onChunk: (chunk) => {
        chunks.push(chunk);
        controller.abort();
      },
      onComplete: () => complete++,
      onError: () => assert.fail("cancel is silent"),
    },
    { signal: controller.signal },
  );

  assert.equal(result, false);
  assert.deepEqual(chunks, ["partial"]);
  assert.equal(complete, 0);
  assert.equal(transportSignal?.aborted, true);
});

test("SDK connection failures and SDK timeout errors use onError once", async () => {
  for (const error of [
    new Error("offline"),
    new DOMException("deadline", "AbortError"),
  ]) {
    const errors: Error[] = [];

    assert.equal(
      await runSDK(
        async () => {
          throw error;
        },
        { onError: (e) => errors.push(e) },
      ),
      false,
    );
    assert.equal(errors.length, 1);
    if (error.name === "AbortError") {
      assert.equal(errors[0].name, "TimeoutError");
      assert.match(errors[0].message, /超时/);
    }
  }
});

test("deadline covers a stalled SDK stream after headers", async () => {
  let signal: AbortSignal | undefined;
  const errors: Error[] = [];

  assert.equal(
    await runSDK(
      async (_url, init) => {
        signal = init!.signal!;

        return new Response(
          new ReadableStream({
            start(stream) {
              signal!.addEventListener("abort", () =>
                stream.error(new DOMException("timeout", "AbortError")),
              );
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        );
      },
      {
        onError: (e) => errors.push(e),
        onComplete: () => assert.fail("timed out"),
      },
      { timeoutMs: 20 },
    ),
    false,
  );
  assert.equal(signal?.aborted, true);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].name, "TimeoutError");
});

test("uTools cancellation works with optional, missing, or throwing abort; late chunks are ignored", async () => {
  for (const mode of ["supported", "missing", "throwing"]) {
    const controller = new AbortController();
    const pending = deferred<unknown>();
    let emit!: (chunk: { content?: string }) => void;
    let aborted = 0;
    const promise = Object.assign(
      pending.promise,
      mode === "missing"
        ? {}
        : {
            abort() {
              aborted++;
              if (mode === "throwing") throw new Error("provider abort failed");
            },
          },
    );
    const chunks: string[] = [];
    const result = runAICompletion(
      (request, callbacks) =>
        collectUtoolsStream(request, callbacks, (callback) => {
          emit = callback;

          return promise;
        }),
      {
        onChunk: (chunk) => chunks.push(chunk),
        onComplete: () => assert.fail("cancelled"),
        onError: () => assert.fail("cancelled"),
      },
      { signal: controller.signal },
    );

    emit({ content: "partial" });
    controller.abort();
    assert.equal(await result, false);
    emit({ content: "stale" });
    pending.reject(new Error("late"));
    await tick();
    assert.deepEqual(chunks, ["partial"]);
    assert.equal(aborted, mode === "missing" ? 0 : 1);
  }
});

test("uTools deadline reports same timeout and aborts provider", async () => {
  let aborted = 0;
  const errors: Error[] = [];

  assert.equal(
    await runAICompletion(
      (request, callbacks) =>
        collectUtoolsStream(request, callbacks, () =>
          Object.assign(new Promise(() => {}), {
            abort() {
              aborted++;
            },
          }),
        ),
      { onError: (e) => errors.push(e) },
      { timeoutMs: 5 },
    ),
    false,
  );
  assert.equal(aborted, 1);
  assert.equal(errors[0].name, "TimeoutError");
});

test("successful legacy two-argument callbacks complete once and release deadline", async () => {
  let aborted = 0;
  const output: string[] = [];

  assert.equal(
    await runAICompletion(
      (request, callbacks) =>
        collectUtoolsStream(request, callbacks, (emit) => {
          emit({ content: "ok" });

          return Object.assign(Promise.resolve(), {
            abort() {
              aborted++;
            },
          });
        }),
      { onComplete: (value) => output.push(value) },
    ),
    true,
  );
  assert.deepEqual(output, ["ok"]);
  assert.equal(aborted, 0);
});

test("request slot prevents old callbacks/finally from updating a new request and cancels on cleanup", () => {
  const slot = new AIRequestSlot();
  const first = slot.start();

  slot.cancel();
  const second = slot.start();

  assert.equal(first.signal.aborted, true);
  assert.equal(slot.owns(first), false);
  slot.finish(first);
  assert.equal(slot.busy, true);
  assert.equal(slot.owns(second), true);
  slot.cancel();
  assert.equal(second.signal.aborted, true);
  assert.equal(slot.owns(second), false);
  assert.equal(slot.busy, false);
});

test("request IDs are unique and message snapshots support structuredClone and JSON", () => {
  const first = createAIRequestId();
  const second = createAIRequestId();

  assert.equal(typeof first, "string");
  assert.notEqual(first, second);
  const messages = [
    { role: "assistant", content: "partial", requestId: first },
  ];

  assert.deepEqual(structuredClone(messages), messages);
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), messages);
});
