import { Car, Shield } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Body, Caption } from "@/components/ui/Typography";

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
}

export default function QRCodeDisplay({
  label,
  vehicles,
  vehicle,
}: QRCodeDisplayProps) {
  const list = useMemo<Vehicle[]>(
    () => (vehicles?.length ? vehicles : vehicle ? [vehicle] : []),
    [vehicles, vehicle],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    list[0]?.id ?? null,
  );

  useEffect(() => {
    if (list.length && !selectedId) setSelectedId(list[0].id);
  }, [list, selectedId]);

  const selected = list.find((v) => v.id === selectedId) ?? null;

  return (
    <View className="mx-5 my-2">
      {/* ── Chip selector ── */}
      {list.length > 1 && (
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
                  size={13}
                  color={active ? "#FFFFFF" : "#6B7280"}
                  strokeWidth={2}
                />
                <Body
                  className={`text-xs font-bold ${active ? "text-white" : "text-light-muted"}`}
                >
                  {v.brand}
                </Body>
                <Caption
                  className={`${active ? "text-white/70" : "text-light-muted/60"}`}
                >
                  {v.plateNumber}
                </Caption>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Card ── */}
      <View className="bg-light-surface rounded-3xl border border-light-border shadow-sm overflow-hidden">
        {/* QR zone */}
        <View className="items-center pt-8 px-6">
          <View className="relative w-52 h-52 items-center justify-center">
            <View className="absolute top-0 left-0 w-6 h-6 border-t-[2.5px] border-l-[2.5px] border-light-accent rounded-tl-lg" />
            <View className="absolute top-0 right-0 w-6 h-6 border-t-[2.5px] border-r-[2.5px] border-light-accent rounded-tr-lg" />
            <View className="absolute bottom-0 left-0 w-6 h-6 border-b-[2.5px] border-l-[2.5px] border-light-accent rounded-bl-lg" />
            <View className="absolute bottom-0 right-0 w-6 h-6 border-b-[2.5px] border-r-[2.5px] border-light-accent rounded-br-lg" />
            {selected?.qrCodeHash ? (
              <QRCode value={selected.qrCodeHash} size={172} />
            ) : (
              <View className="items-center gap-y-2">
                <Car size={32} color="#D1D5DB" strokeWidth={1.4} />
                <Body className="text-light-muted text-sm font-medium">
                  No QR Available
                </Body>
              </View>
            )}
          </View>
        </View>

        {/* Tear divider */}
        <View className="flex-row items-center mt-6">
          <View className="w-5 h-5 rounded-full bg-light-background border border-light-border -ml-2.5" />
          <View className="flex-1 border-t border-dashed border-light-border" />
          <View className="w-5 h-5 rounded-full bg-light-background border border-light-border -mr-2.5" />
        </View>

        {/* ── Info section ── */}
        {/* ── Info section ── */}
        <View className="px-2 pt-3 pb-4 gap-y-3 flex-row">
          {/* Row — Brand | Plate No | Type */}
          {/* Brand */}
          <View className="flex-1 items-center py-3 px-2 gap-y-0.5">
            <Caption className="uppercase tracking-widest font-bold text-light-muted text-base">
              Brand
            </Caption>
            <Body className="text-light-text text-base font-extrabold text-center">
              {selected?.brand ?? "———"}
            </Body>
          </View>

          {/* Divider */}
          <View className="w-px bg-light-border my-3" />

          {/* Plate No */}
          <View className="flex-1 items-center py-3 px-2 gap-y-0.5">
            <Caption className="uppercase tracking-widest font-bold text-light-muted text-base">
              Plate No.
            </Caption>
            <Body className="text-light-accent text-base font-extrabold tracking-[0.18em] uppercase text-center">
              {selected?.plateNumber ?? "———"}
            </Body>
          </View>

          {/* Divider */}
          <View className="w-px bg-light-border my-3" />

          {/* Type */}
          <View className="flex-1 items-center py-3 px-2 gap-y-0.5">
            <Caption className="uppercase tracking-widest font-bold text-light-muted text-base">
              Type
            </Caption>
            <Body className="text-light-text text-base font-extrabold text-center">
              {selected?.vehicleType ?? "Motor"}
            </Body>
          </View>
        </View>

        {/* Primary badge — only shown when isPrimary */}
        {selected?.isPrimary && (
          <View className="flex-row items-center justify-center gap-x-1.5">
            <Shield size={11} color="#9D0215" strokeWidth={2} />
            <Caption className="text-[10px] font-bold text-light-accent uppercase tracking-widest">
              Primary Vehicle
            </Caption>
          </View>
        )}

        {/* Optional label */}
        {label && (
          <Caption className="text-[10px] font-medium text-center uppercase tracking-widest">
            {label}
          </Caption>
        )}
      </View>
    </View>
  );
}
