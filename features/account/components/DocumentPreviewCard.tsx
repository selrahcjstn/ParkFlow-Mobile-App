import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { FileText, ImageOff } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDocumentUrl, openPdf, resolveDocument } from "@/services/documentViewer";

type Loaded = { kind: "image" | "pdf"; url: string };

interface Props {
  title: string;
  /** Stored document link; empty means nothing has been uploaded yet. */
  url?: string | null;
  /** Tapping an image opens it full screen. */
  onOpenImage: (imageUrl: string, title: string) => void;
}

/**
 * Shows a submitted document right on the profile: images appear inline, PDFs show as a file card.
 * There is no "View" button; tapping the document itself enlarges it.
 */
export default function DocumentPreviewCard({ title, url, onOpenImage }: Props) {
  const { colors } = useAppTheme();
  const hasDocument = Boolean(url && (formatDocumentUrl(url) || url.startsWith("private-uploads/")));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!hasDocument || !url) return;
    setLoading(true);
    setError("");
    try {
      setLoaded(await resolveDocument(url));
    } catch (e) {
      setLoaded(null);
      setError(e instanceof Error ? e.message : "Could not load this document.");
    } finally {
      setLoading(false);
    }
  }, [hasDocument, url]);

  useEffect(() => {
    setLoaded(null);
    void load();
  }, [load]);

  const card = "overflow-hidden rounded-button border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface";
  const frame = { height: 168 };

  return (
    <View className="gap-2">
      <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">{title}</Text>
      {!hasDocument ? (
        <View className={`${card} items-center justify-center gap-1.5`} style={frame}>
          <ImageOff size={22} color={colors.muted} />
          <Text className="text-light-muted dark:text-dark-muted text-[12px]">Not uploaded</Text>
        </View>
      ) : loading ? (
        <View className={`${card} items-center justify-center`} style={frame} accessibilityLabel={`Loading ${title}`}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <TouchableOpacity className={`${card} items-center justify-center gap-1.5 px-4`} style={frame} onPress={load} accessibilityRole="button" accessibilityLabel={`Retry loading ${title}`}>
          <Text accessibilityRole="alert" className="text-center text-[12px] text-light-text dark:text-dark-danger">{error}</Text>
          <Text className="text-[12px] font-bold text-light-primary dark:text-dark-primary">Tap to try again</Text>
        </TouchableOpacity>
      ) : loaded?.kind === "image" ? (
        <TouchableOpacity activeOpacity={0.9} className={card} style={frame} onPress={() => onOpenImage(loaded.url, title)} accessibilityRole="imagebutton" accessibilityLabel={`${title}. Tap to enlarge`}>
          <ExpoImage source={{ uri: loaded.url }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
        </TouchableOpacity>
      ) : loaded?.kind === "pdf" ? (
        <TouchableOpacity activeOpacity={0.9} className={`${card} items-center justify-center gap-1.5`} style={frame} onPress={() => openPdf(loaded.url).catch((e) => setError(e instanceof Error ? e.message : "Could not open the PDF."))} accessibilityRole="button" accessibilityLabel={`${title}. Tap to open the PDF`}>
          <FileText size={30} color={colors.primary} />
          <Text className="text-light-text dark:text-dark-text text-[12px] font-semibold">PDF document</Text>
          <Text className="text-light-muted dark:text-dark-muted text-[11px]">Tap to open</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
