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
  containerStyle?: {
    paddingHorizontal?: number;
    paddingVertical?: number;
    gap?: number;
  };
  textStyle?: {
    fontSize?: number;
    letterSpacing?: number;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  };
}

function PillBadge({ icon, label, containerStyle, textStyle }: PillBadgeProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: containerStyle?.gap ?? 7,
        backgroundColor: "#D2273010",
        borderWidth: 0.5,
        borderColor: "#D2273028",
        paddingHorizontal: containerStyle?.paddingHorizontal ?? 18,
        paddingVertical: containerStyle?.paddingVertical ?? 9,
        borderRadius: 999,
      }}
    >
      {icon}
      <Body
        style={{
          fontSize: textStyle?.fontSize ?? 12,
          fontWeight: "700",
          color: lightColors.primary,
          letterSpacing: textStyle?.letterSpacing,
          textTransform: textStyle?.textTransform,
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
              style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}
            >
              <View
                style={{
                  borderRadius: 28,
                  shadowColor: "#000",
                  shadowOpacity: 0.03,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 28,
                    overflow: "hidden",
                    borderWidth: 0.5,
                    borderColor: "rgba(0,0,0,0.08)",
                  }}
                >
                  {/* ── Header: Brand · Type · Primary badge ── */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 0.5,
                      borderBottomColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Left: vehicle identity */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Title
                        className="text-light-text font-black"
                        style={{ fontSize: 17, lineHeight: 20 }}
                        numberOfLines={1}
                      >
                        {item.brand ?? "Unknown"}
                      </Title>
                      {typeLabel ? (
                        <Body
                          className="text-light-muted font-heavy uppercase tracking-widest"
                          style={{ fontSize: 9, marginTop: 2 }}
                          numberOfLines={1}
                        >
                          Type: {typeLabel}
                        </Body>
                      ) : null}
                    </View>

                    {/* Right: Primary badge (Parking Pass text removed) */}
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
                        containerStyle={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          gap: 5,
                        }}
                        textStyle={{
                          fontSize: 9,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      />
                    ) : null}
                  </View>

                  {/* ── QR Code ── */}
                  <View
                    style={{
                      alignItems: "center",
                      paddingTop: 24,
                      paddingBottom: 24,
                      paddingHorizontal: 24,
                      gap: 18,
                    }}
                  >
                    {itemShowLoading ? (
                      <View
                        style={{
                          width: 180,
                          height: 180,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ActivityIndicator
                          size="large"
                          color={lightColors.primary}
                        />
                      </View>
                    ) : item.qrCodeHash ? (
                      <View
                        style={{
                          padding: 12,
                          backgroundColor: "#fff",
                          borderRadius: 20,
                          borderWidth: 0.5,
                          borderColor: "rgba(0,0,0,0.08)",
                        }}
                      >
                        <QRCode value={item.qrCodeHash} size={180} />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 180,
                          height: 180,
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                        }}
                      >
                        <Car
                          size={40}
                          color={lightColors.border}
                          strokeWidth={1.5}
                        />
                        {itemShowEmpty ? (
                          <Body
                            className="text-light-muted font-heavy text-center uppercase tracking-widest"
                            style={{ fontSize: 10 }}
                          >
                            QR Code Unavailable
                          </Body>
                        ) : null}
                      </View>
                    )}

                    {/* Scan pill */}
                    <PillBadge
                      icon={
                        <ScanLine
                          size={14}
                          color={lightColors.primary}
                          strokeWidth={2.5}
                        />
                      }
                      label="Scan at the terminal"
                    />
                  </View>

                  {/* ── Bottom: Plate number with label ── */}
                  <View
                    style={{
                      borderTopWidth: 0.5,
                      borderTopColor: "rgba(0,0,0,0.06)",
                      backgroundColor: "#FAFAFA",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                    }}
                  >
                    {itemShowLoading ? (
                      <View
                        style={{
                          height: 28,
                          width: 120,
                          borderRadius: 8,
                          backgroundColor: "#EBEBEB",
                        }}
                      />
                    ) : (
                      <>
                        <Body
                          className="text-light-muted font-heavy uppercase tracking-widest"
                          style={{ fontSize: 9, marginBottom: 2 }}
                        >
                          Plate Number
                        </Body>
                        <Title
                          className="text-light-text font-black tracking-widest uppercase"
                          style={{ fontSize: 22 }}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {item.plateNumber ?? "———"}
                        </Title>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Dot Pagination ── */}
      {displayList.length > 1 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 16,
          }}
        >
          {displayList.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => goTo(index)}>
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
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
