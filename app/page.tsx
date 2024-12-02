import DynamicTabs from "@/components/dynamicTabs/dynamicTabs";
import MonacoJsonEditor from "@/components/MonacoEditor/monacoJsonEditor";

export default function Home() {
  return (
    <div>
      <DynamicTabs />
      <MonacoJsonEditor></MonacoJsonEditor>
    </div>
  );
}
