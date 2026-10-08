/**
 * MentorListScreen — student browses real senior mentors.
 * Mentors = students from list_students() whose roles include 'mentor'.
 * Filters by campus and year via mentorMatchesStudent; Connect opens MatchScreen.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MentorCard from '../components/MentorCard';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { mentorMatchesStudent } from '../lib/matchMentors';
import { listMentorRequests } from '../lib/mentorRequests';
import { listStudents, mentorsFrom } from '../../../lib/students';
import { SkeletonCard } from '../../../components/Skeleton';
import { trackFeature } from '../../../lib/usagePing';
import { useSyncTick } from '../../../lib/autoSync';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

// Turn a list_students() row into the shape MentorCard expects.
function toMentorCard(student) {
    return {
        id: student.id,
        name: student.name,
        expertise: student.fitnessGoal || 'Fitness',
        year: student.yearOfStudy,
        level: student.experienceLevel || 'Mentor',
        campus: student.campus,
        photo: student.avatarUrl,
        quote: student.course ? `${student.course} student and campus mentor.` : 'UJ campus mentor.',
        appearAsMentor: student.appearAsMentor,
    };
}

const campusFilters = ['All Campuses', 'APK', 'APB', 'DFC', 'SWC'];

export default function MentorListScreen({navigation}) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    const { profile, currentStudent } = useApp();
    const [selectedCampus, setSelectedCampus] = useState('All Campuses');
    const [requests, setRequests] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const studentYear = profile?.yearOfStudy || '';
    const studentId = currentStudent?.id || 'guest';
    const syncTick = useSyncTick(); // reload after reconnecting

    useFocusEffect(
        useCallback(() => {
            let alive = true;
            trackFeature('Mentors');
            listMentorRequests(studentId).then((rows) => {
                if (alive) setRequests(rows);
            });
            listStudents()
                .then((students) => {
                    if (alive) setMentors(mentorsFrom(students, studentId).map(toMentorCard));
                })
                .finally(() => {
                    if (alive) setLoading(false);
                });
            return () => {
                alive = false;
            };
        }, [studentId, syncTick])
    );

    const requestedIds = useMemo(() => new Set(requests.map((row) => row.mentorId)), [requests]);

    // Hide anyone below the student's year, other campuses, or mentors who opted out.
    const filteredMentors = useMemo(() => {
        return mentors.filter((mentor) => {
            if (mentor.appearAsMentor === false) return false;
            if (!mentorMatchesStudent(mentor, studentYear)) return false;
            if (selectedCampus !== 'All Campuses' && mentor.campus !== selectedCampus) return false;
            return true;
        });
    }, [selectedCampus, studentYear, mentors]);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack?.()} hitSlop={10} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={colors.brand} />
                </TouchableOpacity>
                <View style={styles.brandRow}>
                    <Text style={[styles.brandU, { color: colors.text }]}>U</Text>
                    <Text style={[styles.brandU, { color: colors.brand }]}>FITNESS</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <Text style={styles.kicker}>CONNECT</Text>
            <Text style={styles.slogan}>Mentors</Text>
            <Text style={styles.subtitle}>
                {studentYear
                    ? `Seniors at or above your year (${studentYear}) on your campus.`
                    : 'Set your year in Profile to match with senior mentors.'}
            </Text>

            {requests.length ? (
                <Text style={styles.yearHint}>
                    Pending: {requests.map((row) => row.mentorName).join(', ')}
                </Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {campusFilters.map((campus) => (
                    <TouchableOpacity
                        key={campus}
                        style={[
                            styles.filterButton,
                            selectedCampus === campus && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedCampus(campus)}
                    >
                        <Text
                            style={[
                                styles.filterButtonText,
                                selectedCampus === campus && styles.filterButtonTextActive,
                            ]}
                        >
                            {campus === 'All Campuses' ? 'All' : campus}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filteredMentors}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <MentorCard
                        mentor={item}
                        connectLabel={requestedIds.has(item.id) ? 'Requested' : 'Connect'}
                        onPress={() => navigation.navigate('Match', { mentor: item })}
                        onPressConnect={() => navigation.navigate('Match', { mentor: item })}
                        onPressChat={() => navigation.navigate('Match', { mentor: item })}
                    />
                )}
                ListEmptyComponent={
                    loading ? (
                        <View>
                            <SkeletonCard style={{ marginHorizontal: 0 }} />
                            <SkeletonCard style={{ marginHorizontal: 0 }} />
                        </View>
                    ) : (
                        <Text style={styles.empty}>
                            {studentYear
                                ? 'No mentors at or above your year on this campus yet. Mentors are 3rd-year+ students invited by Campus Admin.'
                                : 'Add your year of study in setup to see senior mentors.'}
                        </Text>
                    )
                }
            />
        </View>
    );
}

function createStyles(colors, isDark) {
    return StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 8,
            backgroundColor: 'transparent',
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
        },
        brandRow: { flexDirection: 'row', alignItems: 'center' },
        brandU: {
            ...display,
            fontSize: 20,
            textTransform: 'uppercase',
        },
        kicker: {
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.4,
            color: colors.brand,
            marginBottom: 4,
        },
        slogan: {
            ...display,
            fontSize: 28,
            color: colors.text,
            marginBottom: 6,
            textTransform: 'uppercase',
        },
        subtitle: {
            fontSize: 14,
            color: colors.muted,
            marginBottom: 8,
            lineHeight: 20,
        },
        yearHint: {
            fontSize: 12,
            color: colors.muted,
            marginBottom: 12,
            lineHeight: 17,
        },
        empty: {
            textAlign: 'center',
            color: colors.muted,
            marginTop: 24,
            fontSize: 14,
            lineHeight: 20,
        },
        filterRow: {
            flexDirection: 'row',
            marginBottom: 12,
            gap: 8,
            paddingRight: 8,
        },
        filterButton: {
            backgroundColor: colors.card,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 14,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        filterButtonActive: {
            backgroundColor: colors.brand,
            borderColor: colors.brand,
        },
        filterButtonText: {
            color: colors.text,
            fontWeight: '700',
            fontSize: 12,
        },
        filterButtonTextActive: {
            color: '#ffffff',
        },
    });
}
