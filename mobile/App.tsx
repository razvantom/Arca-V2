import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

type County = { id: number; name: string };
type Organization = { id: number; name: string };
type Locality = { id: number; name: string };
type Section = { id: number; number: number; name: string };
type Membership = {
  id: string;
  status: string;
  organization: { id: number; name: string; countyId: number };
};

type Screen = "login" | "register" | "profile";

const API = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3001";

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "600" },
  tabs: { flexDirection: "row", gap: 12, marginTop: 16 },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#111827", borderColor: "#111827" },
  tabText: { fontWeight: "600", color: "#111827" },
  tabTextActive: { color: "white" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 20 },
  field: { marginTop: 12 },
  label: { fontSize: 13, marginBottom: 6, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "white",
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  buttonSecondary: { backgroundColor: "#4b5563" },
  buttonText: { color: "white", fontWeight: "600" },
  message: { marginTop: 12, color: "#b91c1c" },
  muted: { opacity: 0.7 },
  profileCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
});

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [counties, setCounties] = useState<County[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [countyId, setCountyId] = useState<number | "">("");
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [localityId, setLocalityId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [profileGeo, setProfileGeo] = useState<{
    county?: County;
    organization?: Organization;
    locality?: Locality;
    section?: Section;
  } | null>(null);

  const selectedCounty = useMemo(
    () => (typeof countyId === "number" ? counties.find((c) => c.id === countyId) : undefined),
    [counties, countyId],
  );
  const selectedOrganization = useMemo(
    () =>
      typeof organizationId === "number"
        ? organizations.find((o) => o.id === organizationId)
        : undefined,
    [organizations, organizationId],
  );
  const selectedLocality = useMemo(
    () =>
      typeof localityId === "number" ? localities.find((l) => l.id === localityId) : undefined,
    [localities, localityId],
  );
  const selectedSection = useMemo(
    () => (typeof sectionId === "number" ? sections.find((s) => s.id === sectionId) : undefined),
    [sections, sectionId],
  );

  useEffect(() => {
    fetch(`${API}/api/v1/geo/counties`)
      .then((r) => r.json())
      .then(setCounties)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setOrganizations([]);
    setOrganizationId("");
    setLocalities([]);
    setLocalityId("");
    setSections([]);
    setSectionId("");
    if (countyId === "") return;
    fetch(`${API}/api/v1/geo/counties/${countyId}/organizations`)
      .then((r) => r.json())
      .then(setOrganizations)
      .catch(console.error);
  }, [countyId]);

  useEffect(() => {
    setLocalities([]);
    setLocalityId("");
    setSections([]);
    setSectionId("");
    if (organizationId === "") return;
    fetch(`${API}/api/v1/geo/organizations/${organizationId}/localities`)
      .then((r) => r.json())
      .then(setLocalities)
      .catch(console.error);
  }, [organizationId]);

  useEffect(() => {
    setSections([]);
    setSectionId("");
    if (localityId === "") return;
    fetch(`${API}/api/v1/geo/localities/${localityId}/polling-sections`)
      .then((r) => r.json())
      .then(setSections)
      .catch(console.error);
  }, [localityId]);

  useEffect(() => {
    if (!membership || profileGeo?.county) return;
    const county = counties.find((c) => c.id === membership.organization.countyId);
    if (county) {
      setProfileGeo((current) => ({ ...current, county }));
    }
  }, [counties, membership, profileGeo?.county]);

  const loadMemberships = async (token: string) => {
    const response = await fetch(`${API}/api/v1/memberships`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const data: Membership[] = await response.json();
    const nextMembership = data[0] ?? null;
    setMembership(nextMembership);
    if (nextMembership) {
      setProfileGeo((current) => ({
        county: current?.county,
        organization: current?.organization ?? {
          id: nextMembership.organization.id,
          name: nextMembership.organization.name,
        },
        locality: current?.locality,
        section: current?.section,
      }));
    }
  };

  const handleLogin = async () => {
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail || undefined,
          phone: loginPhone || undefined,
          password: loginPassword,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      await loadMemberships(data.accessToken);
      setScreen("profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setMessage(null);
    if (
      countyId === "" ||
      organizationId === "" ||
      localityId === "" ||
      sectionId === "" ||
      !firstName ||
      !lastName ||
      !registerPassword ||
      (!registerEmail && !registerPhone)
    ) {
      setMessage("Completează toate câmpurile și selectează geo.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail || undefined,
          phone: registerPhone || undefined,
          password: registerPassword,
          firstName,
          lastName,
          countyId,
          organizationId,
          localityId,
          pollingSectionId: sectionId,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      setProfileGeo({
        county: selectedCounty,
        organization: selectedOrganization,
        locality: selectedLocality,
        section: selectedSection,
      });
      await loadMemberships(data.accessToken);
      setScreen("profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Register failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAccessToken(null);
    setMembership(null);
    setProfileGeo(null);
    setScreen("login");
  };

  const switchScreen = (next: Screen) => {
    setMessage(null);
    setScreen(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>ARCA v2 — Mobile (MVP)</Text>
      <Text style={styles.muted}>API: {API}</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => switchScreen("login")}
          style={[styles.tab, screen === "login" && styles.tabActive]}
        >
          <Text style={[styles.tabText, screen === "login" && styles.tabTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => switchScreen("register")}
          style={[styles.tab, screen === "register" && styles.tabActive]}
        >
          <Text style={[styles.tabText, screen === "register" && styles.tabTextActive]}>
            Register
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => switchScreen("profile")}
          style={[styles.tab, screen === "profile" && styles.tabActive]}
        >
          <Text style={[styles.tabText, screen === "profile" && styles.tabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {screen === "login" && (
          <View>
            <Text style={styles.sectionTitle}>Autentificare</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="email@exemplu.ro"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={loginPhone}
                onChangeText={setLoginPhone}
                placeholder="07xx xxx xxx"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Parolă</Text>
              <TextInput
                style={styles.input}
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Parola"
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {screen === "register" && (
          <View>
            <Text style={styles.sectionTitle}>Înregistrare</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Prenume</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Nume</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                placeholder="email@exemplu.ro"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={registerPhone}
                onChangeText={setRegisterPhone}
                placeholder="07xx xxx xxx"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Parolă</Text>
              <TextInput
                style={styles.input}
                value={registerPassword}
                onChangeText={setRegisterPassword}
                placeholder="Parola"
                secureTextEntry
              />
            </View>

            <Text style={styles.sectionTitle}>Selectează geo</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Județ</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={countyId} onValueChange={setCountyId}>
                  <Picker.Item label="Selectează județ" value="" />
                  {counties.map((county) => (
                    <Picker.Item key={county.id} label={county.name} value={county.id} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Organizație (UAT)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={organizationId}
                  onValueChange={setOrganizationId}
                  enabled={countyId !== ""}
                >
                  <Picker.Item label="Selectează organizație" value="" />
                  {organizations.map((org) => (
                    <Picker.Item key={org.id} label={org.name} value={org.id} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Localitate</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={localityId}
                  onValueChange={setLocalityId}
                  enabled={organizationId !== ""}
                >
                  <Picker.Item label="Selectează localitate" value="" />
                  {localities.map((locality) => (
                    <Picker.Item key={locality.id} label={locality.name} value={locality.id} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Secție de votare</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={sectionId}
                  onValueChange={setSectionId}
                  enabled={localityId !== ""}
                >
                  <Picker.Item label="Selectează secție" value="" />
                  {sections.map((section) => (
                    <Picker.Item
                      key={section.id}
                      label={`#${section.number} — ${section.name}`}
                      value={section.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {screen === "profile" && (
          <View>
            <Text style={styles.sectionTitle}>Profil</Text>
            <View style={styles.profileCard}>
              <Text style={styles.label}>Geo selectat</Text>
              <Text>Județ: {profileGeo?.county?.name ?? "-"}</Text>
              <Text>Organizație: {profileGeo?.organization?.name ?? "-"}</Text>
              <Text>Localitate: {profileGeo?.locality?.name ?? "-"}</Text>
              <Text>Secție: {profileGeo?.section ? `#${profileGeo.section.number}` : "-"}</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.label}>Membership</Text>
              <Text>Status: {membership?.status ?? "-"}</Text>
              <Text>Organizație: {membership?.organization.name ?? "-"}</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.label}>Access token</Text>
              <Text numberOfLines={2}>{accessToken ?? "-"}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        {message && <Text style={styles.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
