import React, { FC, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import {
  useMetricsViewModel,
  type MetricsFilter,
  type DayMetric,
} from "../viewmodels/useMetricsViewModel";

const FILTERS: { label: string; value: MetricsFilter }[] = [
  { label: "Today", value: "TODAY" },
  { label: "Last 5 Days", value: "LAST_5_DAYS" },
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
];

const BAR_MAX_HEIGHT = 120;
const BAR_MIN_HEIGHT = 4;

interface BarChartProps {
  data: DayMetric[];
  valueKey: "minutes" | "calories";
  color: string;
}

const BarChart: FC<BarChartProps> = ({ data, valueKey, color }) => {
  const values = data.map((d) => d[valueKey]);
  const maxValue = Math.max(...values, 1);

  return (
    <View style={styles.chartContainer}>
      {data.map((item, index) => {
        const value = item[valueKey];
        const barHeight = Math.max(
          BAR_MIN_HEIGHT,
          (value / maxValue) * BAR_MAX_HEIGHT
        );
        return (
          <View key={index} style={styles.barColumn}>
            <Text style={styles.barValue}>
              {value > 0 ? String(value) : ""}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{item.date}</Text>
          </View>
        );
      })}
    </View>
  );
};

const MetricsScreen: FC = () => {
  const [filter, setFilter] = useState<MetricsFilter>("LAST_7_DAYS");
  const { getDayMetrics } = useMetricsViewModel();

  const data = getDayMetrics(filter);

  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);
  const totalCalories =
    Math.round(data.reduce((sum, d) => sum + d.calories, 0) * 10) / 10;
  const totalSessions = data.reduce((sum, d) => sum + d.sessionCount, 0);

  const isEmpty = totalSessions === 0;
  const hasTimingData = totalMinutes > 0 || totalCalories > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Metrics",
          headerLeft: () => (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              accessibilityLabel="Go back"
              style={styles.headerBackButton}
            >
              <Text style={styles.headerBackButtonText}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {/* Filter toggle bar */}
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.value}
                style={[
                  styles.filterTab,
                  filter === f.value && styles.filterTabActive,
                ]}
                onPress={() => setFilter(f.value)}
                accessibilityLabel={`Filter metrics by ${f.label}`}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === f.value && styles.filterTabTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No completed sessions in this period.
              </Text>
            </View>
          ) : (
            <>
              {/* Sessions summary */}
              <View style={styles.card}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sessions</Text>
                  <Text style={styles.summaryValue}>{totalSessions}</Text>
                </View>
              </View>

              {hasTimingData ? (
                <>
                  {/* Minutes chart */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Minutes</Text>
                    <BarChart data={data} valueKey="minutes" color="#2563EB" />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total</Text>
                      <Text style={styles.summaryValue}>{totalMinutes} min</Text>
                    </View>
                  </View>

                  {/* Calories chart */}
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Calories</Text>
                    <BarChart data={data} valueKey="calories" color="#F59E0B" />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total</Text>
                      <Text style={styles.summaryValue}>{totalCalories} cal</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.noTimingNote}>
                  <Text style={styles.noTimingNoteText}>
                    Use the set timer during workouts to track minutes and calories.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default MetricsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  headerBackButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerBackButtonText: {
    fontSize: 17,
    color: "#2563EB",
    fontWeight: "500",
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B6B6B",
    textAlign: "center",
  },
  noTimingNote: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  noTimingNoteText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
    minHeight: 14,
  },
  barTrack: {
    width: "60%",
    height: BAR_MAX_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#6B6B6B",
    marginTop: 6,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
});
