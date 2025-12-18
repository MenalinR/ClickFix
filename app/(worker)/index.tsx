import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { useStore } from '../../constants/Store';

export default function WorkerDashboard() {
    const router = useRouter();
    const { jobs, updateJobStatus } = useStore();
    const workerId = '1'; // TODO: Replace with real logged-in worker's id
    const pendingJobs = jobs.filter(j => j.status === 'Pending' && j.workerId === workerId);
    const earnings = jobs.filter(j => j.status === 'Completed' && j.workerId === workerId).reduce((acc, j) => acc + j.price, 0);
    const completedCount = jobs.filter(j => j.status === 'Completed' && j.workerId === workerId).length;

    // Notification for new job requests
    const prevPendingCount = useRef(pendingJobs.length);
    useEffect(() => {
        if (pendingJobs.length > prevPendingCount.current) {
            Alert.alert('New Booking', 'You have a new job request!');
        }
        prevPendingCount.current = pendingJobs.length;
    }, [pendingJobs.length]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.dismissAll()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Dashboard</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{completedCount}</Text>
                        <Text style={styles.statLabel}>Jobs Done</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{earnings} LKR</Text>
                        <Text style={styles.statLabel}>Earnings</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>New Job Requests</Text>
                {pendingJobs.length === 0 ? (
                    <Text style={styles.emptyText}>No new requests.</Text>
                ) : (
                    pendingJobs.map(job => (
                        <View key={job.id} style={styles.jobCard}>
                            <Text style={styles.jobTitle}>{job.service} - {job.price} LKR</Text>
                            <Text style={styles.jobDesc}>{job.description}</Text>
                            <Text style={styles.jobDate}>{job.date}</Text>
                            <View style={styles.actions}>
                                <Button
                                    title="Accept"
                                    style={{ flex: 1, marginRight: 8 }}
                                    onPress={() => updateJobStatus(job.id, 'Accepted')}
                                />
                                <Button
                                    title="Reject"
                                    variant="outline"
                                    style={{ flex: 1 }}
                                    onPress={() => updateJobStatus(job.id, 'Rejected')}
                                />
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backButton: { marginRight: 16 },
    heading: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.primary },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    statCard: {
        flex: 1, padding: 20, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center'
    },
    statNumber: { color: Colors.white, fontSize: 24, fontFamily: 'Inter_700Bold' },
    statLabel: { color: '#B0DAFF', fontSize: 14 },
    sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
    emptyText: { color: Colors.textSecondary, fontStyle: 'italic' },
    jobCard: {
        padding: 20, backgroundColor: Colors.white, borderRadius: 12, marginBottom: 16,
        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
    },
    jobTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
    jobDesc: { color: Colors.text, marginBottom: 8 },
    jobDate: { color: Colors.textSecondary, fontSize: 12, marginBottom: 16 },
    actions: { flexDirection: 'row' }
});
