import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../constants/Store';
import { Colors } from '../../constants/Colors';

function JobStatusTimeline({ status }) {
    // Define the steps in order
    const steps = [
        'Request Sent',
        'Worker Accepted',
        'On the Way',
        'In Progress',
        'Job Completed',
    ];

    // Map booking status to step index
    const statusToStep = {
        'Pending': 0,
        'Accepted': 1,
        'In Progress': 3,
        'Completed': 4,
        'Rejected': 0,
        'Cancelled': 0,
    };
    const currentStep = statusToStep[status] ?? 0;

    return (
        <View style={styles.timelineContainer}>
            <View style={styles.timelineRow}>
                {steps.map((step, idx) => {
                    const isActive = idx <= currentStep;
                    return (
                        <>
                            <View style={[styles.timelineCircle, isActive && styles.timelineCircleActive]} />
                            {idx < steps.length - 1 && (
                                <View style={[styles.timelineBar, isActive && styles.timelineBarActive]} />
                            )}
                        </>
                    );
                })}
            </View>
            <View style={styles.timelineLabelsRow}>
                {steps.map((step, idx) => (
                    <Text
                        key={step}
                        style={[styles.timelineLabel, idx === currentStep && styles.timelineLabelActive]}
                        numberOfLines={1}
                    >
                        {step}
                    </Text>
                ))}
            </View>
        </View>
    );
}

export default function BookingsScreen() {
    const { jobs } = useStore();
    const [selectedTab, setSelectedTab] = React.useState('Ongoing');

    // Define booking categories and their filter logic
    const TABS = [
        { label: 'Ongoing', value: 'Ongoing' },
        { label: 'Upcoming', value: 'Upcoming' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Cancelled', value: 'Cancelled' },
    ];

    // Map job statuses to categories
    const getCategory = (status) => {
        switch (status) {
            case 'Pending':
            case 'Accepted':
            case 'In Progress':
                return 'Ongoing';
            case 'Upcoming':
                return 'Upcoming';
            case 'Completed':
                return 'Completed';
            case 'Rejected':
            case 'Cancelled':
                return 'Cancelled';
            default:
                return 'Ongoing';
        }
    };

    const filteredJobs = jobs.filter(j => getCategory(j.status) === selectedTab);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#FFC107';
            case 'Accepted': return '#28A745';
            case 'Rejected': return '#DC3545';
            case 'Completed': return Colors.primary;
            default: return Colors.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>My Bookings</Text>
            {/* Tabs for booking categories */}
            <View style={styles.tabsContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.value}
                        style={[styles.tab, selectedTab === tab.value && styles.tabActive]}
                        onPress={() => setSelectedTab(tab.value)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab.value && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <FlatList
                data={filteredJobs}
                keyExtractor={j => j.id}
                contentContainerStyle={{ padding: 24 }}
                ListEmptyComponent={<Text style={styles.emptyText}>No bookings in this category.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {/* Service & Status Row */}
                        <View style={styles.row}>
                            <Text style={styles.service}>{item.service}</Text>
                            <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                        </View>
                        {/* Booking ID & Date/Time */}
                        <View style={styles.row}>
                            <Text style={styles.bookingId}>ID: {item.id}</Text>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>
                        {/* Worker Details */}
                        <View style={styles.workerRow}>
                            <Image
                                source={item.workerAvatar ? { uri: item.workerAvatar } : require('../../assets/images/default-avatar.png')}
                                style={styles.avatar}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.workerName}>{item.workerName}</Text>
                                <View style={styles.ratingRow}>
                                    <Text style={styles.ratingStar}>⭐</Text>
                                    <Text style={styles.ratingText}>{item.workerRating || 'N/A'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.contactBtn}>
                                <Text style={styles.contactBtnText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.contactBtn}>
                                <Text style={styles.contactBtnText}>Chat</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Location */}
                        <View style={styles.locationRow}>
                            <Text style={styles.locationLabel}>📍 {item.address || 'No address'}</Text>
                            {item.distance && <Text style={styles.distance}>{item.distance} km</Text>}
                        </View>
                        {/* Description */}
                        <Text style={styles.desc}>{item.description}</Text>
                        {/* Job Status Timeline */}
                        <JobStatusTimeline status={item.status} />
                        {/* Actions Placeholder */}
                        {/* <View style={styles.actionsRow}>
                            <Text style={styles.actionsText}>[Action Buttons Here]</Text>
                        </View> */}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    heading: { fontSize: 24, fontFamily: 'Inter_700Bold', padding: 24, paddingBottom: 0 },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        marginTop: 8,
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: 4,
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: Colors.accent,
    },
    tabText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
    },
    tabTextActive: {
        color: Colors.white,
    },
    card: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    service: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    status: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    bookingId: { color: Colors.textSecondary, fontSize: 12 },
    date: { color: '#999', fontSize: 12 },
    workerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#eee' },
    workerName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    ratingStar: { color: '#FFD700', fontSize: 14, marginRight: 2 },
    ratingText: { color: Colors.textSecondary, fontSize: 13 },
    contactBtn: { backgroundColor: Colors.accent, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 6 },
    contactBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    locationLabel: { color: Colors.text, fontSize: 13, flex: 1 },
    distance: { color: Colors.textSecondary, fontSize: 12 },
    desc: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
    timelineContainer: { backgroundColor: '#F5F5F5', borderRadius: 6, padding: 8, marginBottom: 6 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    timelineCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#ccc', borderWidth: 2, borderColor: '#ccc' },
    timelineCircleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
    timelineBar: { flex: 1, height: 3, backgroundColor: '#ccc', marginHorizontal: 2, borderRadius: 2 },
    timelineBarActive: { backgroundColor: Colors.accent },
    timelineLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timelineLabel: { color: Colors.textSecondary, fontSize: 10, flex: 1, textAlign: 'center' },
    timelineLabelActive: { color: Colors.accent, fontWeight: 'bold' },
    actionsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
    actionsText: { color: Colors.textSecondary, fontSize: 13 },
    emptyText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        marginTop: 40,
        fontSize: 16,
    },
});
