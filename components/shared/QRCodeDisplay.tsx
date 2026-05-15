import { lightColors } from "@/constants/theme";
import { Body, Caption } from "@/components/ui/Typography";
import { Car, Shield } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
  vehicleType?: string;
}

interface QRCodeDisplayProps {
  label?: string;
  vehicles?: Vehicle[];
  vehicle?: Vehicle | null;
  isLoading?: boolean;
  hasHydrated?: boolean;
}

function QrCodeSkeleton() {
  return (
    <View className="items-center gap-y-3">
      <ActivityIndicator size="large" color={lightColors.accent} />
      <Caption className="font-semibold">Loading your QR code…</Caption>
    </View>
  );
}

function InfoSkeleton() {
  return (
    <>
      <View className="flex-1 items-center py-3 px-2 gap-y-2">
        <View className="h-3 w-12 rounded bg-light-border" />
        <View className="h-4 w-16 rounded bg-light-border" />
      </View>
      <View className="w-px bg-light-border my-3" />
      <View className="flex-1 items-center py-3 px-2 gap-y-2">
        <View className="h-3 w-14 rounded bg-light-border" />
        <View className="h-4 w-20 rounded bg-light-border" />
      </View>
      <View className="w-px bg-light-border my-3" />
      <View className="flex-1 items-center py-3 px-2 gap-y-2">
        <View className="h-3 w-10 rounded bg-light-border" />
        <View className="h-4 w-14 rounded bg-light-border" />
      </View>
    </>
  );
}

export default function QRCodeDisplay({
  label,
  vehicles,
  vehicle,
  isLoading = false,
  hasHydrated = false,
}: QRCodeDisplayProps) {
  const list = useMemo<Vehicle[]>(
    () => (vehicles?.length ? vehicles : vehicle ? [vehicle] : []),
    [vehicles, vehicle],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    list[0]?.id ?? null,
  );

  useEffect(() => {
    if (list.length) {
      setSelectedId((current) =>
        current && list.some((v) => v.id === current) ? current : list[0].id,
      );
    }
  }, [list]);

  const selected = list.find((v) => v.id === selectedId) ?? list[0] ?? null;
  const showLoading = isLoading || !hasHydrated;
  const showEmpty =
    hasHydrated && !isLoading && (!selected || !selected.qrCodeHash);

  return (
    <View className="mx-5 my-2">
      {list.length > 1 && !showLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
        >
          {list.map((v) => {
            const active = v.id === selectedId;
            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => setSelectedId(v.id)}
                activeOpacity={0.7}
                className={`flex-row items-center gap-x-2 px-3.5 py-2 rounded-full border ${
                  active
                    ? "bg-light-accent border-light-accent"
                    : "bg-light-surface border-light-border"
                }`}
              >
                <Car
                  size={14}
                  color={active ? "#FFFFFF" : lightColors.muted}
                  strokeWidth={2}
                />
                <Body
                  className={`text-sm font-bold ${active ? "text-white" : "text-light-muted"}`}
                >
                  {v.brand}
                </Body>
                <Caption
                  className={active ? "text-white/70" : "text-light-muted/60"}
                >
                  {v.plateNumber}
                </Caption>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View className="bg-light-surface rounded-3xl border border-light-border shadow-sm overflow-hidden">
        <View className="items-center pt-8 px-6">
          <View className="relative w-52 h-52 items-center justify-center">
            <View className="absolute top-0 left-0 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-light-accent rounded-tl-lg" />
            <View className="absolute top-0 right-0 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-light-accent rounded-tr-lg" />
            <View className="absolute bottom-0 left-0 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-light-accent rounded-bl-lg" />
            <View className="absolute bottom-0 right-0 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-light-accent rounded-br-lg" />
            {showLoading ? (
              <QrCodeSkeleton />
            ) : selected?.qrCodeHash ? (
              <QRCode value={selected.qrCodeHash} size={172} />
            ) : (
              <View className="items-center gap-y-2">
                <Car size={32} color={lightColors.border} strokeWidth={1.4} />
                <Body className="text-light-muted font-medium text-center px-4">
                  {showEmpty ? "No QR Available" : ""}
                </Body>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-center mt-6">
          <View className="w-5 h-5 rounded-full bg-light-background border border-light-border -ml-2.5" />
          <View className="flex-1 border-t border-dashed border-light-border" />
          <View className="w-5 h-5 rounded-full bg-light-background border border-light-border -mr-2.5" />
        </View>

        <View className="px-2 pt-3 pb-4 gap-y-3 flex-row">
          {showLoading ? (
            <InfoSkeleton />
          ) : (
            <>
              <View className="flex-1 items-center py-3 px-2 gap-y-0.5">
                <Caption className="uppercase tracking-widest font-bold">
                  Brand
                </Caption>
                <Body className="font-extrabold text-center">
                  {selected?.brand ?? "———"}
                </Body>
              </View>
              <View className="w-px bg-light-border my-3" />
              <View className="flex-1 items-center py-3 px-2 gap-y-0.5">
                <Caption className="uppercase tracking-widest font-bold">
                  Plate No.
                </Caption>
                <Body className="text-light-accent font-extrabold tracking-[0.18em] uppercase text-center">
                  {selected?.plateNumber ?? "———"}
                </Body>
              </View>
              <View className="w-px bg-light-border my-3" />
              <View className="flex-1 items-center py-3 px-2 gap-y-0.5">
                <Caption className="uppercase tracking-widest font-bold">
                  Type
                </Caption>
                <Body className="font-extrabold text-center">
                  {selected?.vehicleType ?? "Motor"}
                </Body>
              </View>
            </>
          )}
        </View>

        {selected?.isPrimary && !showLoading ? (
          <View className="flex-row items-center justify-center gap-x-1.5 pb-2">
            <Shield size={12} color={lightColors.primary} strokeWidth={2} />
            <Caption className="font-bold text-light-accent uppercase tracking-widest">
              Primary Vehicle
            </Caption>
          </View>
        ) : null}

        {label && !showLoading ? (
          <Caption className="font-medium text-center uppercase tracking-widest pb-3">
            {label}
          </Caption>
        ) : null}
      </View>
    </View>
  );
}
