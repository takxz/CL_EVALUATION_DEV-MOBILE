import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import description_meteo from "@/assets/description_meteo.json";

export default function Favorite({ coords }: { coords: string }) {
  const router = useRouter();
  const [cityName, setCityName] = useState<string>("");
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const [lat, lon] = coords.split("_");

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    )
      .then((res) => res.json())
      .then((data) => {
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          "Inconnu";
        setCityName(city);
      })
      .catch(console.error);

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
    )
      .then((res) => res.json())
      .then(setWeather)
      .catch(console.error);
  }, [coords]);

  function getWeatherInfo(code: number): any {
    return (
      String(code) ?? {
        description: "Inconnu",
        image: "",
      }
    );
  }

  const weatherInfo = weather?.current
    ? getWeatherInfo(weather.current.weather_code)
    : null;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/detail/${coords}`)}
    >
      <View style={styles.topRow}>
        <View style={styles.textGroup}>
          <Text style={styles.cityName}>{cityName || "..."}</Text>
          <Text style={styles.description}>
            {weatherInfo?.description ?? "..."}
          </Text>
        </View>
        {weatherInfo?.image ? (
          <Image source={{ uri: weatherInfo.image }} style={styles.icon} />
        ) : null}
      </View>
      <Text style={styles.temperature}>
        {weather?.current?.temperature_2m != null
          ? `${Math.round(weather.current.temperature_2m)}°`
          : "..."}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#132C52",
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  description: {
    fontSize: 12,
    color: "#8BA8C8",
  },
  icon: {
    width: 40,
    height: 40,
  },
  temperature: {
    fontSize: 36,
    fontWeight: "300",
    color: "#fff",
  },
});
