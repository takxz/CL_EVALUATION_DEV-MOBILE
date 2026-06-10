import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import description_meteo from "@/assets/description_meteo.json";
import { MapPin, Search } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [weather, setWeather] = useState<any>([]);
  const [cityName, setCityName] = useState<string>("");
  const [cityInput, setCityInput] = useState<string>("");

  useEffect(() => {
    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
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
  }, []);

  useEffect(() => {
    async function getWeather() {
      if (!location) return;

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&current=temperature_2m,wind_speed_10m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min`,
        );
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    }

    getWeather();
  }, [location]);

  function getWeatherDescriptionAndIcon(code: number) {
    return (
      description_meteo[String(code)] ?? { description: "Inconnu", image: "" }
    );
  }

  const weatherInfo = weather.current
    ? getWeatherDescriptionAndIcon(weather.current.weather_code)
    : null;

  const transformedCityInput = cityInput.trim().toLowerCase();

  async function handleCitySearch() {
    if (!transformedCityInput) return;

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${transformedCityInput}&count=1&language=fr`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const coordinates = data.results[0];
        const id = `${coordinates.latitude.toFixed(4)}_${coordinates.longitude.toFixed(4)}`;
        router.push(`/detail/${id}`);
      }
    } catch (error) {
      console.error("Error fetching city data:", error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Météo</Text>
          <TextInput
            style={styles.input}
            placeholder="Rechercher une ville..."
            placeholderTextColor="#8BA8C8"
            value={cityInput}
            onChangeText={setCityInput}
          />
          <Pressable style={styles.searchButton} onPress={handleCitySearch}>
            <Search color="#8BA8C8" />
          </Pressable>
        </View>

        <View style={styles.weatherCard}>
          <View style={styles.cityRow}>
            <MapPin size={13} color="#8BA8C8" />
            <Text style={styles.cityText}>
              {cityName || "Récupération de la position..."}
            </Text>
          </View>

          <View style={styles.heroSection}>
            {weatherInfo?.image ? (
              <Image
                source={{ uri: weatherInfo.image }}
                style={styles.weatherImage}
              />
            ) : null}
            <Text style={styles.temperature}>
              {weather.current
                ? `${weather.current.temperature_2m?.toFixed(0)}°`
                : "°"}
            </Text>
            <Text style={styles.weatherDescription}>
              {weatherInfo?.description ?? "Chargement..."}
            </Text>
          </View>

          {weather.current && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Ressenti</Text>
                <Text style={styles.statValue}>
                  {weather.current?.apparent_temperature?.toFixed(0)}°
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Vent</Text>
                <Text style={styles.statValue}>
                  {weather.current?.wind_speed_10m?.toFixed(0)} km/h
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Min / Max</Text>
                <Text style={styles.statValue}>
                  {weather.daily?.temperature_2m_min[0]?.toFixed(0)}° /{" "}
                  {weather.daily?.temperature_2m_max[0]?.toFixed(0)}°
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.favoritesContainer}>
          <Text style={styles.sectionTitle}>Villes favorites</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1E3D",
  },
  container: {
    flex: 1,
    backgroundColor: "#0B1E3D",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 24,
    marginBottom: 20,
    gap: 14,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#132C52",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#1E3F6E",
  },
  searchButton: {
    position: "absolute",
    right: 30,
    top: 12,
    padding: 8,
    color: "#8BA8C8",
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
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 20,
  },
  cityText: {
    fontSize: 14,
    color: "#8BA8C8",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
    gap: 4,
  },
  weatherImage: {
    width: 72,
    height: 72,
    marginBottom: 4,
  },
  temperature: {
    fontSize: 72,
    fontWeight: "200",
    color: "#fff",
    lineHeight: 80,
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
  favoritesContainer: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
});
