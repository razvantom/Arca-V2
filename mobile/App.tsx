import { useEffect, useState } from "react";
import { SafeAreaView, Text, View, FlatList, TouchableOpacity } from "react-native";

type County = { id: number; name: string };

const API = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function App() {
  const [counties, setCounties] = useState<County[]>([]);
  const [selected, setSelected] = useState<County | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/geo/counties`)
      .then((r) => r.json())
      .then(setCounties)
      .catch(console.error);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>ARCA v2 — Mobile (MVP)</Text>
      <Text style={{ marginTop: 8, opacity: 0.7 }}>
        Test rapid: încărcare județe din API.
      </Text>

      <View style={{ marginTop: 16, flex: 1 }}>
        <FlatList
          data={counties}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelected(item)} style={{ paddingVertical: 10 }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={{ paddingTop: 8 }}>
        <Text>Selected: {selected ? selected.name : "-"}</Text>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>API: {API}</Text>
      </View>
    </SafeAreaView>
  );
}
