import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const statusColor = (status: string): string => {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "#FFA500";
  if (s === "worker accepted") return "#F57F17";
  if (s === "negotiating") return "#1565C0";
  if (s === "accepted") return "#4CAF50";
  if (s === "in progress") return "#2196F3";
  if (s === "completed") return "#2E7D32";
  if (s === "cancelled" || s === "rejected" || s === "denied") return "#C62828";
  return Colors.textSecondary;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type CountdownKind = "overdue" | "today" | "soon" | "future" | "done";

function getCountdown(
  scheduledDate: string | Date | undefined,
  status: string,
): { label: string; kind: CountdownKind } | null {
  if (!scheduledDate) return null;
  const date = new Date(scheduledDate);
  if (isNaN(date.getTime())) return null;

  const s = (status || "").toLowerCase();
  if (
    s === "completed" ||
    s === "cancelled" ||
    s === "rejected" ||
    s === "denied"
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const days = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days < 0) return { label: "Overdue", kind: "overdue" };
  if (days === 0) return { label: "Today", kind: "today" };
  if (days === 1) return { label: "Tomorrow", kind: "soon" };
  return { label: `In ${days} days`, kind: "future" };
}

const countdownColor = (kind: CountdownKind): string => {
  if (kind === "overdue") return "#C62828";
  if (kind === "today") return "#E65100";
  if (kind === "soon") return "#1565C0";
  if (kind === "future") return "#2E7D32";
  return "#2E7D32";
};

export default function ScheduleScreen() {
  const { jobs, fetchJobs, token, user } = useStore();
  const workerId = (user as any)?._id || (user as any)?.id;
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState<Date>(today);
  const [detailJob, setDetailJob] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) fetchJobs();
    }, [token]),
  );

  const myJobs = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];
    return list.filter((j: any) => {
      const wId = j.workerId?._id || j.workerId;
      const rId = j.requestedWorkerId?._id || j.requestedWorkerId;
      return (
        (wId && String(wId) === String(workerId)) ||
        (rId && String(rId) === String(workerId))
      );
    });
  }, [jobs, workerId]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    myJobs.forEach((j: any) => {
      const d = new Date(j.scheduledDate || j.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(j);
      map.set(key, arr);
    });
    return map;
  }, [myJobs]);

  const monthLabel = cursor.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstDayOfMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0,
  ).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  // Group into rows of 7 so we can render each row as a flex row
  // (avoids percentage-width rounding that would drop Saturday on some devices)
  const weekRows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekRows.push(cells.slice(i, i + 7));
  }

  const selectedKey = `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`;
  const jobsOnSelected = jobsByDate.get(selectedKey) || [];

  const goPrevMonth = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNextMonth = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const formatTime = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Schedule</Text>

        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.navBtn}>
              <Ionicons
                name="chevron-back"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.navBtn}>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {weekRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.weekRow}>
                {row.map((cell, colIdx) => {
                  if (!cell) {
                    return (
                      <View
                        key={`${rowIdx}-${colIdx}`}
                        style={styles.cell}
                      />
                    );
                  }
                  const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
                  const dayJobs = jobsByDate.get(key) || [];
                  const isToday = sameDay(cell, today);
                  const isSelected = sameDay(cell, selected);
                  return (
                    <TouchableOpacity
                      key={`${rowIdx}-${colIdx}`}
                      style={[
                        styles.cell,
                        isSelected && styles.cellSelected,
                        isToday && !isSelected && styles.cellToday,
                      ]}
                      onPress={() => setSelected(cell)}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          isSelected && styles.cellTextSelected,
                        ]}
                      >
                        {cell.getDate()}
                      </Text>
                      <View style={styles.dotsRow}>
                        {dayJobs.slice(0, 3).map((j, i2) => (
                          <View
                            key={i2}
                            style={[
                              styles.dot,
                              { backgroundColor: statusColor(j.status) },
                            ]}
                          />
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.listHeading}>
          {selected.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>

        {jobsOnSelected.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons
              name="calendar-outline"
              size={44}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No jobs scheduled</Text>
          </View>
        ) : (
          jobsOnSelected
            .sort(
              (a: any, b: any) =>
                new Date(a.scheduledDate || a.createdAt).getTime() -
                new Date(b.scheduledDate || b.createdAt).getTime(),
            )
            .map((j: any) => {
              const id = j._id || j.id;
              const customerName = j.customerId?.name || "Customer";
              const countdown = getCountdown(
                j.scheduledDate || j.createdAt,
                j.status,
              );
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.jobRow}
                  onPress={() => setDetailJob(j)}
                >
                  <View
                    style={[
                      styles.jobDot,
                      { backgroundColor: statusColor(j.status) },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTime}>
                      {formatTime(j.scheduledDate || j.createdAt)} ·{" "}
                      {j.serviceType}
                    </Text>
                    <Text style={styles.jobSubtitle} numberOfLines={1}>
                      {customerName} · {j.status}
                    </Text>
                  </View>
                  {countdown && (
                    <View
                      style={[
                        styles.countdownBadge,
                        { backgroundColor: countdownColor(countdown.kind) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countdownText,
                          { color: countdownColor(countdown.kind) },
                        ]}
                      >
                        {countdown.label}
                      </Text>
                    </View>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
        )}
      </ScrollView>

      <Modal
        visible={!!detailJob}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailJob(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {detailJob?.serviceType || "Job"}
                </Text>
                <View style={styles.modalStatusRow}>
                  <View
                    style={[
                      styles.jobDot,
                      { backgroundColor: statusColor(detailJob?.status) },
                    ]}
                  />
                  <Text style={styles.modalStatusText}>
                    {detailJob?.status || "—"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setDetailJob(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.modalRowText}>
                {detailJob?.customerId?.name || "Customer"}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.modalRowText}>
                {detailJob
                  ? new Date(
                      detailJob.scheduledDate || detailJob.createdAt,
                    ).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </Text>
            </View>

            {(() => {
              const cd = getCountdown(
                detailJob?.scheduledDate || detailJob?.createdAt,
                detailJob?.status,
              );
              if (!cd) return null;
              const color = countdownColor(cd.kind);
              return (
                <View style={styles.modalRow}>
                  <Ionicons
                    name={cd.kind === "overdue" ? "alert-circle-outline" : "hourglass-outline"}
                    size={16}
                    color={color}
                  />
                  <Text style={[styles.modalRowText, { color, fontWeight: "700" }]}>
                    {cd.label}
                  </Text>
                </View>
              );
            })()}

            {!!detailJob?.location?.address && (
              <View style={styles.modalRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.modalRowText} numberOfLines={2}>
                  {detailJob.location.address}
                </Text>
              </View>
            )}

            {!!detailJob?.description && (
              <View style={styles.modalDescBlock}>
                <Text style={styles.modalDescLabel}>Description</Text>
                <Text style={styles.modalDescText}>{detailJob.description}</Text>
              </View>
            )}

            {(() => {
              const status = (detailJob?.status || "").toLowerCase();
              const isFinalized =
                status !== "pending" &&
                status !== "worker accepted" &&
                status !== "negotiating";
              const price = isFinalized
                ? detailJob?.pricing?.totalAmount ||
                  detailJob?.pricing?.serviceCharge
                : detailJob?.pricing?.negotiatedPrice ||
                  detailJob?.pricing?.proposedPrice ||
                  detailJob?.pricing?.totalAmount ||
                  detailJob?.pricing?.serviceCharge;
              if (!price) return null;
              return (
                <View style={styles.modalPriceBlock}>
                  <Text style={styles.modalPriceLabel}>
                    {isFinalized ? "Agreed Price" : "Price"}
                  </Text>
                  <Text style={styles.modalPriceValue}>{price} LKR</Text>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 60 },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  calendar: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: { padding: 6 },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  daysRow: { flexDirection: "row", paddingBottom: 6 },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  grid: {},
  weekRow: { flexDirection: "row" },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  cellSelected: { backgroundColor: Colors.primary },
  cellToday: {
    backgroundColor: Colors.lightBackground,
  },
  cellText: { fontSize: 13, color: Colors.text },
  cellTextSelected: { color: "white", fontWeight: "700" },
  dotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    minHeight: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  listHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },
  emptyWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 30,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  jobDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  jobTime: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  jobSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 18,
    width: "100%",
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  modalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  modalStatusText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  modalRowText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  modalDescBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalDescLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalDescText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  modalPriceBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalPriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  modalPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
});
