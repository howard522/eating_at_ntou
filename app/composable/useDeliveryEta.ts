import { onBeforeUnmount, onMounted, ref, type Ref, computed, watch } from "vue";

type LatLng = [number, number];

interface DeliveryEtaOptions {
  origin: Ref<LatLng | null>;
  destination: Ref<LatLng | null>;
  enabled?: Ref<boolean>;
  refreshIntervalMs?: number;
}

const formatTime = (date: Date | null) => {
  if (!date) return "";
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function useDeliveryEta({
  origin,
  destination,
  enabled = ref(true),
  refreshIntervalMs = 60000,
}: DeliveryEtaOptions) {
  const etaMinutes = ref<number | null>(null);
  const etaSeconds = ref<number | null>(null);
  const etaArriveAt = ref<Date | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const etaTimeString = computed(() => formatTime(etaArriveAt.value));

  const refreshEta = async () => {
    if (!enabled.value) return;
    const originValue = origin.value;
    const destinationValue = destination.value;
    if (!originValue || !destinationValue) {
      etaMinutes.value = null;
      etaSeconds.value = null;
      etaArriveAt.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const [originLat, originLng] = originValue;
      const [destLat, destLng] = destinationValue;

      const response = await $fetch<{
        data: {
          durationSeconds: number;
          durationMinutes: number;
        };
      }>("/api/cart/delivery-time", {
        params: {
          originLatitude: originLat,
          originLongitude: originLng,
          destinationLatitude: destLat,
          destinationLongitude: destLng,
        },
      });

      if (response?.data) {
        etaMinutes.value = response.data.durationMinutes;
        etaSeconds.value = response.data.durationSeconds;
        etaArriveAt.value = new Date(Date.now() + response.data.durationSeconds * 1000);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch ETA.";
      etaMinutes.value = null;
      etaSeconds.value = null;
      etaArriveAt.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  watch(
    [origin, destination, enabled],
    () => {
      if (enabled.value) {
        refreshEta();
      } else {
        etaMinutes.value = null;
        etaSeconds.value = null;
        etaArriveAt.value = null;
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    if (refreshIntervalMs > 0) {
      intervalId = setInterval(refreshEta, refreshIntervalMs);
    }
  });

  onBeforeUnmount(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return {
    etaMinutes,
    etaSeconds,
    etaArriveAt,
    etaTimeString,
    isLoading,
    error,
    refreshEta,
  };
}