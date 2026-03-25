import { defineComponent, type PropType } from "vue";
import type { TokenBalance } from "@/types/monitor";
import SentinelTokenForm from "./SentinelTokenForm";
import SentinelTokenGrid from "./SentinelTokenGrid";

export default defineComponent({
  name: "SentinelDeployerPanel",
  props: {
    modelValue: { type: String as PropType<string>, required: true },
    tokens: { type: Array as PropType<readonly TokenBalance[]>, required: true },
    formDisabled: { type: Boolean as PropType<boolean>, default: false },
  },
  emits: ["update:modelValue", "submit", "remove"],
  setup(props, { emit }) {
    return () => (
      <div class="mt-10 bg-linear-to-br from-zinc-900 to-black border border-white/5 p-8 rounded-[3rem]">
        <h3 class="text-lg font-bold mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          Sentinel_Agent_Deployer
        </h3>
        <SentinelTokenForm
          modelValue={props.modelValue}
          disabled={props.formDisabled}
          onUpdate:modelValue={(v: string) => emit("update:modelValue", v)}
          onSubmit={() => emit("submit")}
        />
        <SentinelTokenGrid
          tokens={props.tokens}
          onRemove={(id: string) => emit("remove", id)}
        />
      </div>
    );
  },
});
