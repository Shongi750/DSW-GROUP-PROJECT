import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';

export default function ProfileEditScreen({ navigation }) {
  const [profile, setProfile] = useState({
    name: '',
    campus: '',
    goal: '',
    level: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) return;

        const userDocRef = doc(db, 'users', currentUserId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            name: data.name || '',
            campus: data.campus || '',
            goal: data.goal || '',
            level: data.level || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile: ", error);
        Alert.alert("Error", "Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile.name || !profile.campus) {
      return Alert.alert("Missing Info", "Please ensure your name and campus are filled in.");
    }

    setSaving(true);
    try {
      const currentUserId = auth.currentUser?.uid;
      const userDocRef = doc(db, 'users', currentUserId);
      
      await updateDoc(userDocRef, {
        name: profile.name,
        campus: profile.campus.toUpperCase(),
        goal: profile.goal,
        level: profile.level
      });

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "Awesome", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error updating profile: ", error);
      Alert.alert("Error", "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="e.g. Jane Doe"
            />

            <Text style={styles.label}>Campus Location</Text>
            <TextInput
              style={styles.input}
              value={profile.campus}
              onChangeText={(text) => setProfile({ ...profile, campus: text })}
              placeholder="e.g. APK, APB, DFC, SWC"
              autoCapitalize="characters"
            />
            <Text style={styles.helperText}>Use abbreviations: APK, APB, DFC, or SWC</Text>

            <Text style={styles.label}>Primary Fitness Goal</Text>
            <TextInput
              style={styles.input}
              value={profile.goal}
              onChangeText={(text) => setProfile({ ...profile, goal: text })}
              placeholder="e.g. Build Muscle, Lose Weight"
            />

            <Text style={styles.label}>Experience Level</Text>
            <TextInput
              style={styles.input}
              value={profile.level}
              onChangeText={(text) => setProfile({ ...profile, level: text })}
              placeholder="e.g. Beginner, Intermediate, Advanced"
            />

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  scrollContent: { paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backText: { fontSize: 16, color: '#FF6F00', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  
  formContainer: { paddingHorizontal: 20, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, marginTop: 16 },
  helperText: { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#1A1A1A'
  },
  saveButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});