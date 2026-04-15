import { defineComponent } from "vue";
import type { IProps } from "./interface";
import { useSentinelTokenFormData } from "./useData";

export default defineComponent({
  name: "SentinelTokenForm",
  ...useSentinelTokenFormData(),
  setup: (props: IProps, { emit }) => {
      return () => (
        <div class="flex gap-4">
          <input
            value={props.modelValue}
            onInput={(e) =>
              emit("update:modelValue", (e.target as HTMLInputElement).value)
            }
            disabled={props.disabled}
            placeholder="0x... (ERC-20 Contract Address)"
            class="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
          />
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => emit("submit")}
            class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            Scan_&_Deploy
          </button>
        </div>
      );
    },
});
