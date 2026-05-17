import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { Car, ScanLine, ShieldCheck } from "lucide-react-native";
import { ReactNode, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
  vehicleType?: number | string;
}

interface QRCodeDisplayProps {
  vehicles?: Vehicle[];
  vehicle?: Vehicle | null;
  isLoading?: boolean;
  hasHydrated?: boolean;
}

interface PillBadgeProps {
  icon: ReactNode;
  label: string;
  className?: string;
}

function PillBadge({ icon, label, className = "" }: PillBadgeProps) {
  return (
    <View
      className={`flex-row items-center border border-solid rounded-full ${className}`}
      style={{
        backgroundColor: "#D2273010",
        borderColor: "#D2273028",
      }}
    >
      {icon}
      <Body
        className="font-bold text-xs"
        style={{
          color: lightColors.primary,
        }}
      >
        {label}
      </Body>
    </View>
  );
}

export default function QRCodeDisplay({
  vehicles,
  vehicle,
  isLoading = false,
  hasHydrated = false,
}: QRCodeDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const displayList = useMemo<Vehicle[]>(() => {
    const baseList = vehicles?.length ? vehicles : vehicle ? [vehicle] : [];
    if (baseList.length === 0) return [];

    return baseList
      .flatMap((item, i) =>
        Array.from({ length: 5 }, (_, j) => ({
          ...item,
          id: `${item.id}-${i}-${j}`,
        })),
      )
      .slice(0, 5);
  }, [vehicles, vehicle]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, displayList.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setActiveIndex(clamped);
  };

  if (displayList.length === 0 && !isLoading) return null;

  return (
    <View className="my-2">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ width: SCREEN_WIDTH }}
      >
        {displayList.map((item) => {
          const itemHasData = !!item.qrCodeHash;
          const itemShowLoading = isLoading && !itemHasData;
          const itemShowEmpty = hasHydrated && !isLoading && !itemHasData;
          const typeLabel = getVehicleTypeLabel(item.vehicleType);

          return (
            <View
              key={item.id}
              className="px-5"
              style={{ width: SCREEN_WIDTH }}
            >
              {/* Outer Card Shadow Box Wrapper */}
              <View
                className="rounded-[28px]"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                {/* Inner Card Container */}
                <View className="bg-white rounded-[28px] overflow-hidden border border-black/10">
                  <View className="items-center pt-6 pb-5 px-6 gap-y-6">
                    <View className="w-full items-center justify-center relative min-h-[36px]">
                      <View className="items-center">
                        <Title
                          className="text-light-text font-black text-lg leading-5 tracking-tight text-center max-w-[160px] uppercase"
                          numberOfLines={1}
                        >
                          {item.brand ?? "Unknown"}
                        </Title>
                        <Body className="text-light-muted font-heavy lineheig uppercase tracking-widest text-[9px] leading-none">
                          Brand
                        </Body>
                      </View>

                      {item.isPrimary ? (
                        <PillBadge
                          icon={
                            <ShieldCheck
                              size={11}
                              color={lightColors.primary}
                              strokeWidth={2.5}
                            />
                          }
                          label="Primary"
                          className="absolute right-0 top-1 px-2 py-1 gap-x-1"
                        />
                      ) : null}
                    </View>
                    {/* QR Engine View Framework Container */}
                    {itemShowLoading ? (
                      <View className="w-[180px] h-[180px] items-center justify-center">
                        <ActivityIndicator
                          size="large"
                          color={lightColors.primary}
                        />
                      </View>
                    ) : item.qrCodeHash ? (
                      <View className="bg-white">
                        <QRCode value={item.qrCodeHash} size={180} />
                      </View>
                    ) : (
                      <View className="w-[180px] h-[180px] items-center justify-center gap-y-2">
                        <Car
                          size={40}
                          color={lightColors.border}
                          strokeWidth={1.5}
                        />
                        {itemShowEmpty ? (
                          <Body className="text-light-muted font-heavy text-center uppercase tracking-widest text-[10px]">
                            QR Code Unavailable
                          </Body>
                        ) : null}
                      </View>
                    )}
                    Action Scan Pill Badge Row
                    <PillBadge
                      icon={
                        <ScanLine
                          size={14}
                          color={lightColors.primary}
                          strokeWidth={2.5}
                        />
                      }
                      label="Scan at the terminal"
                      className="px-[18px] py-[9px] gap-x-[7px]"
                    />
                  </View>

                  {/* ── Bottom Identity Split Sheet ── */}
                  <View className="border-t border-black/5 bg-[#FAFAFA] py-4 px-6">
                    {itemShowLoading ? (
                      <View className="h-12 w-32 rounded-lg bg-[#EBEBEB] self-center" />
                    ) : (
                      <View className="flex-row items-center justify-between w-full">
                        {/* Centered Plate Segment details block */}
                        <View className="flex-1 items-center justify-center pr-4">
                          <Body className="text-light-muted font-heavy uppercase tracking-widest text-[9px] leading-none">
                            Plate Number
                          </Body>
                          <Title
                            className="text-light-text font-black tracking-widest uppercase text-[15px]"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {item.plateNumber ?? "———"}
                          </Title>
                        </View>

                        {/* Mid Structural Divider Line */}
                        <View className="w-[1px] h-9 bg-black/10 mx-1" />

                        {/* Split Vehicle Classification Type Placement */}
                        <View className="flex-1 items-center justify-center pl-4">
                          <Body className="text-light-muted font-heavy uppercase tracking-widest text-[9px] leading-none">
                            Type
                          </Body>
                          <Body
                            className="text-light-text font-black uppercase text-[15px] tracking-wide"
                            numberOfLines={1}
                          >
                            {typeLabel ?? "———"}
                          </Body>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      {displayList.length > 1 ? (
        <View className="flex-row items-center justify-center gap-x-1.5 mt-4">
          {displayList.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => goTo(index)}>
              <View
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    activeIndex === index
                      ? lightColors.primary
                      : "rgba(0,0,0,0.15)",
                  width: activeIndex === index ? 22 : 6,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
