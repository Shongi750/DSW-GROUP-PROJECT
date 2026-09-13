import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';

export default function BuddyScreen({ navigation }) {
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [myCampus, setMyCampus] = useState(""); // ✨ NEW: State to hold the user's campus

  const fetchData = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      // ✨ 1. Fetch the current user's campus first
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      let campusFilter = null;
      if (currentUserDoc.exists()) {
        campusFilter = currentUserDoc.data().campus;
        setMyCampus(campusFilter || "Unknown Campus");
      }

      // ✨ 2. Query other students, but ONLY those at the same campus!
      const usersRef = collection(db, 'users');
      const usersQuery = campusFilter 
        ? query(usersRef, where('campus', '==', campusFilter)) 
        : usersRef; // Fallback to all users if they somehow have no campus

      const usersSnapshot = await getDocs(usersQuery);
      const loadedBuddies = [];

      usersSnapshot.forEach((d) => {
        const userData = d.data();
        // Don't show the current user to themselves
        if (userData.uid !== currentUserId) {
          loadedBuddies.push({
            id: userData.uid,
            name: userData.name || 'Unknown Student',
            campus: userData.campus || 'Campus Not Set',
            goal: userData.goal || 'General fitness',
            level: userData.level || 'Beginner'
          });
        }
      });
      setBuddies(loadedBuddies);

      // 3. Fetch incoming pending requests
      const requestsRef = collection(db, 'friend_requests');
      const q = query(requestsRef, where('receiverId', '==', currentUserId), where('status', '==', 'pending'));
      const requestsSnap = await getDocs(q);
      
      const loadedRequests = [];
      for (const reqDoc of requestsSnap.docs) {
        const reqData = reqDoc.data();
        const senderDoc = await getDoc(doc(db, 'users', reqData.senderId));
        const senderName = senderDoc.exists() ? senderDoc.data().name : 'A student';
        
        loadedRequests.push({
          id: reqDoc.id,
          senderName: senderName,
          ...reqData
        });
      }
      setPendingRequests(loadedRequests);

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh the list automatically when they open this tab
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    fetchData();
    return unsubscribe;
  }, [navigation]);

  const handleConnect = async (targetUserId, targetName) => {
    try {
      setRequestingId(targetUserId);
      const currentUserId = auth.currentUser?.uid;

      const requestsRef = collection(db, 'friend_requests');
      const q = query(requestsRef, where('senderId', '==', currentUserId), where('receiverId', '==', targetUserId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        Alert.alert("Already Sent", `You have already sent a request to ${targetName}.`);
        setRequestingId(null);
        return;
      }

      await addDoc(requestsRef, {
        senderId: currentUserId,
        receiverId: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      Alert.alert("Request Sent!", `A buddy request has been sent to ${targetName}.`);
    } catch (error) {
      console.error("Error sending request: ", error);
    } finally {
      setRequestingId(null);
    }
  };

  const handleRespond = async (requestId, responseStatus) => {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), { status: responseStatus });
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      if (responseStatus === 'accepted') {
        Alert.alert("Success", "Buddy added to your network!");
      }
    } catch (error) {
      console.error("Error updating request: ", error);
    }
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;

    return (
      <View style={styles.pendingSection}>
        <Text style={styles.sectionTitle}>Pending Requests</Text>
        {pendingRequests.map(req => (
          <View key={req.id} style={styles.pendingCard}>
            <Text style={styles.pendingText}><Text style={{fontWeight: '700'}}>{req.senderName}</Text> wants to connect!</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleRespond(req.id, 'accepted')}>
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleRespond(req.id, 'declined')}>
                <Text style={styles.actionBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderBuddy = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.badge}>{item.level}</Text>
        <Text style={styles.details}>📍 {item.campus}</Text>
        <Text style={styles.details}>🎯 {item.goal}</Text>
      </View>
      <TouchableOpacity 
        style={styles.connectBtn} 
        onPress={() => handleConnect(item.id, item.name)}
        disabled={requestingId === item.id}
      >
        {requestingId === item.id ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.connectBtnText}>Connect</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Find a Buddy</Text>
        {/* ✨ NEW: Dynamic Subtitle showing their specific campus! */}
        <Text style={styles.headerSubtitle}>Students at {myCampus} sharing your goals.</Text>
      </View>

      <FlatList
        ListHeaderComponent={renderPendingRequests}
        data={buddies}
        keyExtractor={item => item.id}
        renderItem={renderBuddy}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No other students found at {myCampus} yet! Invite some friends.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  headerContainer: { padding: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#FF6F00', fontWeight: '600' }, // Made the subtitle orange so it pops
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888888', textAlign: 'center', lineHeight: 24 },
  
  // Pending Requests Styles
  pendingSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  pendingCard: { backgroundColor: '#FFF3E0', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#FFE0B2' },
  pendingText: { fontSize: 16, color: '#1A1A1A', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#4CAF50' },
  declineBtn: { backgroundColor: '#E0E0E0' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#F0F0F0', elevation: 2,
  },
  infoContainer: { flex: 1, paddingRight: 15 },
  name: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  badge: { 
    alignSelf: 'flex-start', backgroundColor: '#FFF3E0', color: '#E65100', 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, 
    fontWeight: '700', marginBottom: 8, overflow: 'hidden'
  },
  details: { fontSize: 14, color: '#666666', marginBottom: 4 },
  connectBtn: { backgroundColor: '#FF6F00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  connectBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }
});