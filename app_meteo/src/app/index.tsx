import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import description_meteo from "@/assets/description_meteo.json";

export default function HomeScreen() {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenue sur l'App Météo!</Text>
        <Text style={styles.subtitle}>
          Obtenez les dernières mises à jour météorologiques pour votre
          localisation.
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Entrez le nom de la ville"
          value={cityInput}
          onChangeText={setCityInput}
        />
      </View>
      <View style={styles.currentWeatherContainer}>
      {cityName ? (
        <Text style={styles.subtitle}>{cityName}</Text>
      ) : (
        <Text style={styles.subtitle}>Récupération de votre position...</Text>
      )}
        {weather.current ? (
          <View style={styles.currentWeatherDetails}>
            <Text style={styles.subtitle}>
              {weather.current.temperature_2m}°C
            </Text>
            <Text style={styles.subtitle}>
              {weather.current.wind_speed_10m} km/h
            </Text>
            <Text style={styles.subtitle}>
              {weather.current.apparent_temperature}°C
            </Text>
            <Text style={styles.subtitle}>
              {weather.daily.temperature_2m_max[0]}°C
            </Text>
            <Text style={styles.subtitle}>
              {weather.daily.temperature_2m_min[0]}°C
            </Text>
            <Text style={styles.subtitle}>
              {
                getWeatherDescriptionAndIcon(weather.current.weather_code)
                  .description
              }
            </Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>Chargement...</Text>
        )}
      </View>
      <View style={styles.favoritesContainer}>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 20,
  },
  currentWeatherContainer: {
    marginTop: 20,
  },
  currentWeatherDetails: {
    alignItems: "center",
  },
});
