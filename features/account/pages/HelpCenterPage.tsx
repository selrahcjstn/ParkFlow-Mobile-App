import { ContentWrapper } from "@/components/layouts";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigation } from "expo-router";
import {
    AlertTriangle,
    Calendar,
    Car,
    ChevronDown,
    ChevronUp,
    CircleHelp,
    Lock,
    Search,
    X,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface FAQItem {
  id: string;
  category: "parking" | "violations" | "account" | "access";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    category: "parking",
    question: "Where am I allowed to park my vehicle?",
    answer:
      "Students and personnel may park only in designated parking zones matching their approved pass type (e.g. Main Gate Parking Area, West Wing Gate, or the Central Carpark). Parking in fire lanes, guard lanes, or restricted slots will result in an immediate violation charge.",
  },
  {
    id: "faq-2",
    category: "access",
    question: "What is a 'Schedule of Attendance' and why is it needed?",
    answer:
      "SAS requires all vehicle owners to declare their scheduled days of attendance (with uploaded Certificate of Registration as proof). This allows our security team to optimize gate access slots and verify that campus entries align with academic schedules.",
  },
  {
    id: "faq-3",
    category: "violations",
    question: "How do I dispute a parking violation ticket?",
    answer:
      "To dispute a violation, navigate to your violations history, select the ticket in question, and press the 'File Dispute' button. You must provide a descriptive explanation and clear proof within 3 academic days of the ticket issue date.",
  },
  {
    id: "faq-4",
    category: "account",
    question: "How can I configure direct Email & Password credentials?",
    answer:
      "If you linked your account via Microsoft SSO, you can create direct login credentials by navigating to 'Account Center', clicking the 'Email & Password' link row, and completing the 6-digit email OTP verification process.",
  },
  {
    id: "faq-5",
    category: "parking",
    question: "What should I do if the digital QR code pass fails at the gate?",
    answer:
      "Ensure your screen brightness is turned up and the QR code is fully visible. If it still fails, the security guards can manually search your license plate number on their dashboard. You can also reload your pass dynamically from the Home screen.",
  },
  {
    id: "faq-6",
    category: "access",
    question: "Can I update my active schedule mid-semester?",
    answer:
      "Yes. You can edit your schedule by navigating to Settings > Schedule and clicking 'Update Schedule'. You will need to re-verify your times and upload an updated COR file if there are major enrollment changes.",
  },
];

type CategoryFilter = "all" | "parking" | "violations" | "account" | "access";

export default function HelpCenterPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const iconColor = colors.text;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string, customColor?: string) => {
    const size = 16;
    const clr = customColor || iconColor;
    switch (category) {
      case "parking":
        return <Car size={size} color={clr} strokeWidth={2.2} />;
      case "violations":
        return (
          <AlertTriangle size={size} color={clr} strokeWidth={2.2} />
        );
      case "account":
        return <Lock size={size} color={clr} strokeWidth={2.2} />;
      case "access":
        return <Calendar size={size} color={clr} strokeWidth={2.2} />;
      default:
        return <CircleHelp size={size} color={clr} strokeWidth={2.2} />;
    }
  };

  const getCategoryColorClass = () => {
    return "bg-light-surfaceLighter dark:bg-dark-surfaceLighter";
  };

  return (
    <ContentWrapper noPaddingY noPaddingX>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Search Bar */}
        <View className="mb-4 px-4">
          <View className="flex-row items-center bg-light-surface dark:bg-dark-surfaceLighter rounded-2xl px-4 border border-light-border/40 dark:border-dark-border/40">
            <Search size={16} color={colors.muted} strokeWidth={2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search questions or keywords..."
              placeholderTextColor={isDark ? "#B5BAC1" : "#71717A"}
              style={{
                flex: 1,
                fontFamily: "Inter-Regular",
                fontSize: 14,
                color: colors.text,
                paddingVertical: 12,
                paddingHorizontal: 10,
              }}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.muted} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Horizontal Selector */}
        <View className="mb-6">
          <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-3 px-4">
            Browse by Topic
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          >
            {(
              ["all", "parking", "access", "violations", "account"] as const
            ).map((cat) => {
              const isActive = activeCategory === cat;

              const bgBorderClass = isActive
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border";

              const textClass = isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-light-accent dark:text-dark-accent";

              const catIconColor = isActive
                ? (isDark ? "#60A5FA" : "#2563EB")
                : iconColor;

              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => {
                    setActiveCategory(cat);
                    setExpandedId(null);
                  }}
                  className={`flex-row items-center gap-2 px-4 py-2.5 rounded-button border ${bgBorderClass}`}
                >
                  {cat !== "all" && getCategoryIcon(cat, catIconColor)}
                  <Text
                    className={`text-[12.5px] font-heavy capitalize ${textClass}`}
                  >
                    {cat === "all" ? "View All" : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* FAQ Accordion List */}
        <View className="gap-3 px-4">
          <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-1">
            Frequently Asked Questions ({filteredFAQs.length})
          </Text>

          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <View
                  key={faq.id}
                  className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border overflow-hidden"
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(faq.id)}
                    className="flex-row items-center justify-between p-4"
                  >
                    <View className="flex-1 flex-row items-center gap-3.5 pr-2">
                      <View
                        className={`w-8 h-8 rounded-button items-center justify-center ${getCategoryColorClass()}`}
                      >
                        {getCategoryIcon(faq.category)}
                      </View>
                      <Text className="flex-1 text-light-text dark:text-dark-text font-heavy text-[13px] leading-5">
                        {faq.question}
                      </Text>
                    </View>
                    <View>
                      {isOpen ? (
                        <ChevronUp
                          size={16}
                          color={colors.muted}
                          strokeWidth={2.5}
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          color={colors.muted}
                          strokeWidth={2.5}
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View className="px-4 pt-3 pb-4 border-t border-light-border/40 dark:border-dark-border/40 bg-light-surfaceMuted/30 dark:bg-dark-surfaceMuted/30">
                      <Text className="text-light-accent dark:text-dark-accent font-regular text-[12.5px] leading-[19px]">
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View className="py-12 items-center justify-center bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border">
              <CircleHelp size={32} color={colors.muted} strokeWidth={1.5} />
              <Text className="text-light-text dark:text-dark-text font-heavy text-[14px] mt-3">
                No results found
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] text-center mt-1 px-8 leading-4">
                We couldn't find any FAQs matching "{search}". Try searching for
                other campus parking keywords.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ContentWrapper>
  );
}
