import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import description_meteo from "@/assets/description_meteo.json";
import { ArrowLeft, MapPin } from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<any>(null);
  const [cityName, setCityName] = useState<string>("");

  function parseId(id: string) {
    const [latStr, lonStr] = id.split("_");
    return { latitude: latStr, longitude: lonStr };
  }

  useEffect(() => {
    async function getLocation() {
      try {
        const { latitude, longitude } = parseId(id);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        );
        const geoData = await geoRes.json();
        const city =
          geoData.address?.city ||
          geoData.address?.town ||
          geoData.address?.village ||
          geoData.address?.county ||
          "Inconnu";
        setCityName(city);
      } catch (error) {
        console.error("Error getting location:", error);
      }
    }
    getLocation();
  }, [id]);

  useEffect(() => {
    async function loadCityWeatherDetail() {
      try {
        const { latitude, longitude } = parseId(id);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,wind_direction_10m,apparent_temperature,weather_code,pressure_msl,precipitation&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset`,
        );
        const data = await response.json();
        setDetail(data);
      } catch (error) {
        console.error("Error fetching city detail:", error);
      }
    }
    loadCityWeatherDetail();
  }, [id]);

  function getWeatherDescriptionAndIcon(code: number) {
    return (
      description_meteo[String(code)] ?? { description: "Inconnu", image: "" }
    );
  }

  function formatTime(isoString: string) {
    if (!isoString) return "--:--";
    return isoString.split("T")[1]?.slice(0, 5) ?? "--:--";
  }

  const weatherInfo = detail?.current
    ? getWeatherDescriptionAndIcon(detail.current.weather_code)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <View style={styles.cityRow}>
              <MapPin size={13} color="#8BA8C8" />
              <Text style={styles.cityText}>
                {cityName || "Chargement..."}
              </Text>
            </View>
          </View>

          <View style={styles.weatherCard}>
            <View style={styles.heroSection}>
              {weatherInfo?.image ? (
                <Image
                  source={{ uri: weatherInfo.image }}
                  style={styles.weatherImage}
                />
              ) : null}
              <Text style={styles.temperature}>
                {detail?.current?.temperature_2m != null
                  ? `${Math.round(detail.current.temperature_2m)}°`
                  : "°"}
              </Text>
              <Text style={styles.weatherDescription}>
                {weatherInfo?.description ?? "Chargement..."}
              </Text>
            </View>

            {detail?.current && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Ressenti</Text>
                  <Text style={styles.statValue}>
                    {Math.round(detail.current.apparent_temperature)}°
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Min / Max</Text>
                  <Text style={styles.statValue}>
                    {Math.round(detail.daily?.temperature_2m_min[0])}° /{" "}
                    {Math.round(detail.daily?.temperature_2m_max[0])}°
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Vent</Text>
                  <Text style={styles.statValue}>
                    {Math.round(detail.current.wind_speed_10m)} km/h
                  </Text>
                </View>
              </View>
            )}
          </View>

          {detail?.current && (
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Détails</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.statLabel}>Direction du vent</Text>
                  <Text style={styles.statValue}>
                    {detail.current.wind_direction_10m}°
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.statLabel}>Pression</Text>
                  <Text style={styles.statValue}>
                    {Math.round(detail.current.pressure_msl)} hPa
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.statLabel}>Précipitations</Text>
                  <Text style={styles.statValue}>
                    {detail.current.precipitation} mm
                  </Text>
                </View>
              </View>
            </View>
          )}

          {detail?.daily && (
            <View style={styles.sunCard}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Lever du soleil</Text>
                <Text style={styles.statValue}>
                  {formatTime(detail.daily.sunrise[0])}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Coucher du soleil</Text>
                <Text style={styles.statValue}>
                  {formatTime(detail.daily.sunset[0])}
                </Text>
              </View>
            </View>
          )}

          <Pressable style={styles.favButton}>
            <Text style={styles.favButtonText}>Ajouter aux favoris</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1E3D",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#0B1E3D",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 24,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#132C52",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cityText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  weatherCard: {
    backgroundColor: "#1A4B8C",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
    gap: 4,
  },
  weatherImage: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
  temperature: {
    fontSize: 80,
    fontWeight: "200",
    color: "#fff",
    lineHeight: 90,
  },
  weatherDescription: {
    fontSize: 18,
    color: "#C5D8F0",
    fontWeight: "500",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#132C52",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#1E3F6E",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#8BA8C8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  detailCard: {
    backgroundColor: "#1A4B8C",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  detailGrid: {
    backgroundColor: "#132C52",
    borderRadius: 14,
    overflow: "hidden",
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#1E3F6E",
    marginHorizontal: 16,
  },
  sunCard: {
    backgroundColor: "#1A4B8C",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  favButton: {
    backgroundColor: "#1A4B8C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3F6E",
  },
  favButtonText: {
    color: "#C5D8F0",
    fontSize: 15,
    fontWeight: "600",
  },
});
