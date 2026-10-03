import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MentorCard from '../components/MentorCard';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { mentorMatchesStudent } from '../lib/matchMentors';
import { listMentorRequests } from '../lib/mentorRequests';
import { loadMentorRoster } from '../../admin/lib/adminStore';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

const mentors = [
    {
        id:'1',
        name:'Sipho Ndlovu',
        expertise:'Fitness',
        availability:'Mon-Fri 9am-5pm',
        year:'3rd Year',
        level:'Intermediate',
        campus:'APB',
        photo:'https://media.istockphoto.com/id/1269814510/photo/young-cheerful-man-of-african-ethnicity-looking-at-you-with-white-toothy-smile.jpg?s=612x612&w=0&k=20&c=qrQqXzn_eXdz-Y85D7_cmm6s8Rrr8CdP27fWCH8WHY4=',
        quote:'Train with purpose and keep your consistency higher than your excuses.'
    },
    {
        id:'2',
        name:'Lerato Mokoena',
        expertise:'Nutrition',
        availability:'Mon-Fri 10am-4pm',
        year:'3rd Year',
        level:'Advanced',
        campus:'APK',
        photo:'https://th.bing.com/th/id/OIP.Druscn_5yB4DALCzdtheDgHaHa?w=167&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3',
        quote:'The right fuel changes everything — we build habits that actually last.'
    },
    {
        id:'3',
        name:'Mike van Heerden',
        expertise:'Strength Training',
        availability:'Mon-Fri 8am-6pm',
        year:'4th Year',
        level:'Beginner',
        campus:'DFC',
        photo:'https://th.bing.com/th/id/OIP.vtjmy5jwBi0aLcVU21HlFAHaEK?w=321&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3',
        quote:'Strong foundations win. I help you lift smarter, recover better, and move with confidence.'
    },
];

const campusFilters = ['All Campuses', 'APK', 'APB', 'DFC', 'SWC'];

export default function MentorListScreen({navigation}) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    const { profile, currentStudent } = useApp();
    const [selectedCampus, setSelectedCampus] = useState('All Campuses');
    const [requests, setRequests] = useState([]);
    const [roster, setRoster] = useState([]);
    const studentYear = profile?.yearOfStudy || '';
    const studentId = currentStudent?.id || 'guest';

    useFocusEffect(
        useCallback(() => {
            let alive = true;
            listMentorRequests(studentId).then((rows) => {
                if (alive) setRequests(rows);
            });
            loadMentorRoster().then((rows) => {
                if (alive) setRoster(rows);
            });
            return () => {
                alive = false;
            };
        }, [studentId])
    );

    const requestedIds = useMemo(() => new Set(requests.map((row) => row.mentorId)), [requests]);

    const filteredMentors = useMemo(() => {
        return [...roster, ...mentors].filter((mentor) => {
            if (mentor.appearAsMentor === false) return false;
            if (!mentorMatchesStudent(mentor, studentYear)) return false;
            if (selectedCampus !== 'All Campuses' && mentor.campus !== selectedCampus) return false;
            return true;
        });
    }, [selectedCampus, studentYear, roster]);

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
                    <Text style={styles.empty}>
                        {studentYear
                            ? 'No mentors at or above your year on this campus yet.'
                            : 'Add your year of study in setup to see senior mentors.'}
                    </Text>
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
