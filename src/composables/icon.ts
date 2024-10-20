import IconFont from "~/components/IconFont.vue";

export const renderIcon = (type: string) => {
  return () => h(IconFont, {type: type})
};
