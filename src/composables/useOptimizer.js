import { computed, toRefs } from 'vue';
import { appState } from '../stores/appState';
import { encodeBase64 } from '../utils/protocols';
import { optimizeNodesBatch } from '../utils/optimizer/optimizerEngine';
import { CS_STR, FM_STR, ARAS_CS, ARAS_FM, ARAS_FP } from '../utils/optimizer/araEngine';

export function useOptimizer() {
  const {
    cleanIp,
    cleanPort,
    customSni,
    prefix,
    inputNodes,
    fragmentEnabled,
    fragmentConfig,
    fpValue,
    csValue,
    fmValue,
    arasMode
  } = toRefs(appState);

  const lastErrors = computed(() => appState.optimizeErrors || []);

  /**
   * Runs the real cf-optimizor batch engine. When Aras Mode is active,
   * the real Aras preset (fp=chrome, lightweight cipher suite list,
   * single tlshello fragment) is used instead of the user's own
   * fp/cs/fm fields — exactly matching the reference tool's behavior.
   */
  const optimizeAll = () => {
    let content = inputNodes.value.trim();
    if (!content) return [];

    const opts = {
      cleanIp: cleanIp.value.trim(),
      cleanPort: cleanPort.value,
      customSni: customSni.value.trim(),
      prefix: prefix.value.trim(),
      fp: arasMode.value ? ARAS_FP : (fpValue.value || 'unsafe'),
      cs: arasMode.value ? ARAS_CS : (csValue.value.trim() || CS_STR),
      fm: arasMode.value ? ARAS_FM : (fmValue.value.trim() || FM_STR),
      fragment: fragmentEnabled.value ? {
        enabled: true,
        length: fragmentConfig.value.length,
        interval: fragmentConfig.value.interval,
        packets: fragmentConfig.value.packets
      } : undefined
    };

    const { rawList, errors } = optimizeNodesBatch(content, opts);
    appState.activeNodes = rawList;
    appState.optimizeErrors = errors;
    return rawList;
  };

  const optimizedNodes = computed(() => appState.activeNodes);
  const optimizedRaw = computed(() => appState.activeNodes.join('\n'));
  const optimizedBase64 = computed(() => encodeBase64(optimizedRaw.value));

  return {
    cleanIp,
    cleanPort,
    customSni,
    prefix,
    inputNodes,
    fragmentEnabled,
    fragmentConfig,
    fpValue,
    csValue,
    fmValue,
    arasMode,
    optimizedNodes,
    optimizedRaw,
    optimizedBase64,
    lastErrors,
    optimizeAll
  };
}
