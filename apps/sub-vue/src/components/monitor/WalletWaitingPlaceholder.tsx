import { defineComponent, type PropType } from "vue";

export default defineComponent({
  name: "WalletWaitingPlaceholder",
  props: {
    visible: { type: Boolean as PropType<boolean>, required: true },
  },
  setup(props) {
    return () =>
      props.visible ? (
        <div class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-4xl">
          <div class="text-zinc-600 font-mono text-xs animate-pulse">
            WAITING_FOR_WALLET_CONNECTION...
          </div>
        </div>
      ) : null;
  },
});
