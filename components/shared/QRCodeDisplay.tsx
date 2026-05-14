// QRCodeDisplay.tsx
import { Car, CheckCircle2, Shield } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
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
  const list: Vehicle[] = vehicles?.length
    ? vehicles
    : vehicle
      ? [vehicle]
      : [];

  const [selectedId, setSelectedId] = useState<string | null>(
    list[0]?.id ?? null,
  );

  useEffect(() => {
    if (list.length && !selectedId) setSelectedId(list[0].id);
  }, [list]);

  const selected = list.find((v) => v.id === selectedId) ?? null;

  return (
    <View className="mx-5 my-2">
      {/* Vehicle chip selector */}
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
                <Text
                  className={`text-xs font-bold ${
                    active ? "text-white" : "text-light-muted"
                  }`}
                >
                  {v.brand}
                </Text>
                <Text
                  className={`text-[10px] font-medium ${
                    active ? "text-white/70" : "text-light-muted/60"
                  }`}
                >
                  {v.plateNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* QR Card */}
      <View className="bg-light-surface rounded-3xl border border-light-border shadow-sm overflow-hidden">
        {/* QR area */}
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
                <Text className="text-light-muted text-sm font-medium">
                  No QR Available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ticket tear divider */}
        <View className="flex-row items-center mt-6">
          <View className="w-5 h-5 rounded-full bg-light-background border border-light-border -ml-2.5" />
          <View className="flex-1 border-t border-dashed border-light-border" />
          <View className="w-5 h-5 rounded-full bg-light-background border border-light-border -mr-2.5" />
        </View>

        {/* Info section */}
        <View className="px-5 pt-4 pb-6">
          {/* Brand row — big and proud */}
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-light-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
                Vehicle
              </Text>
              <Text className="text-light-text text-2xl font-extrabold tracking-tight">
                {selected?.brand ?? "No Vehicle"}
              </Text>
            </View>

            {/* Status badge stacked on the right */}
            {selected?.qrCodeHash ? (
              <View className="items-center bg-light-success/10 border border-light-success/20 rounded-2xl px-3 py-2 gap-y-0.5">
                <CheckCircle2 size={16} color="#10B981" strokeWidth={2.2} />
                <Text className="text-light-success text-[9px] font-bold uppercase tracking-wide">
                  Active
                </Text>
              </View>
            ) : null}
          </View>

          {/* Plate number — styled like a real plate */}
          <View className="mt-3 flex-row items-center gap-x-3">
            <View className="flex-1 border border-light-border rounded-xl px-4 py-2.5 flex-row items-center justify-between bg-light-background">
              <Text className="text-light-muted text-[9px] font-bold uppercase tracking-widest">
                Plate No.
              </Text>
              <Text className="text-light-accent text-base font-extrabold tracking-[0.22em] uppercase">
                {selected?.plateNumber ?? "———"}
              </Text>
            </View>

            {/* Primary badge as icon block */}
            {selected?.isPrimary && (
              <View className="w-11 h-11 rounded-xl bg-light-primary/8 border border-light-primary/20 items-center justify-center">
                <Shield size={18} color="#9D0215" strokeWidth={2} />
              </View>
            )}
          </View>

          {/* Label */}
          {label && (
            <Text className="text-light-muted text-[10px] font-medium text-center mt-4 uppercase tracking-widest">
              {label}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
