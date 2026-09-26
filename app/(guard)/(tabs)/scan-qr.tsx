import { Redirect } from "expo-router";

export default function DummyScanQr() {
  return <Redirect href="/(guard)/(scan)/scan-qr" />;
}
