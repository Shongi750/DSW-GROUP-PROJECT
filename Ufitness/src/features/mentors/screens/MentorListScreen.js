import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MentorCard from '../components/MentorCard';
import { useTheme } from '../../../context/ThemeContext';
import { useApp } from '../../../context/AppContext';
import { mentorMatchesStudent } from '../lib/matchMentors';
import { listMentorRequests } from '../lib/mentorRequests';
import { loadMentorRoster } from '../../admin/lib/adminStore';

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
            if (!mentorMatchesStudent(mentor, studentYear)) return false;
            if (selectedCampus !== 'All Campuses' && mentor.campus !== selectedCampus) return false;
            return true;
        });
    }, [selectedCampus, studentYear, roster]);

    return(
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.headerRow}>
                <Text style={styles.appTitle}>UFitness</Text>
                <TouchableOpacity style={[styles.notificationButton, { backgroundColor: isDark ? colors.overlay : '#fff1e8' }]}>
                    <Text style={styles.notificationIcon}>🔔</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.slogan, { color: colors.text }]}>Connect & Grow</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
                Find a workout buddy to stay motivated or connect with a mentor to reach your fitness goals faster
            </Text>
            <Text style={[styles.yearHint, { color: colors.muted }]}>
                {studentYear
                    ? `Mentors are 3rd year+ and at or above your year (${studentYear}).`
                    : 'Set your year of study in Profile so we can match you with senior mentors.'}
            </Text>

            {requests.length ? (
                <Text style={[styles.yearHint, { color: colors.muted }]}>
                    Pending mentor requests: {requests.map((row) => row.mentorName).join(', ')}
                </Text>
            ) : null}

            <View style={styles.filterRow}>
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
                            {campus}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredMentors}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <MentorCard
                        mentor={item}
                        connectLabel={requestedIds.has(item.id) ? 'Requested' : 'Connect'}
                        onPress={() => navigation.navigate('Match', { mentor: item })}
                        onPressConnect={() => navigation.navigate('Match', { mentor: item })}
                        onPressChat={() => navigation.navigate('Match', { mentor: item })}
                    />
                )}
                ListEmptyComponent={
                    <Text style={[styles.empty, { color: colors.muted }]}>
                        {studentYear
                            ? 'No mentors at or above your year on this campus yet.'
                            : 'Add your year of study in setup to see senior mentors.'}
                    </Text>
                }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f5f7f5',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f97316',
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff1e8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        fontSize: 18,
        color: '#f97316',
        textShadowColor: '#f97316',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
    },
    slogan: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f3c2d',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#47615a',
        marginBottom: 6,
        lineHeight: 18,
    },
    yearHint: {
        fontSize: 12,
        marginBottom: 14,
        lineHeight: 17,
    },
    empty: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 14,
        lineHeight: 20,
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    filterButton: {
        flex: 1,
        backgroundColor: '#fff1e8',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f9c49c',
    },
    filterButtonActive: {
        backgroundColor: '#f97316',
        borderColor: '#f97316',
    },
    filterButtonText: {
        color: '#a84d14',
        fontWeight: '600',
        fontSize: 12,
    },
    filterButtonTextActive: {
        color: '#ffffff',
    },
});
