import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Item, useStorage } from '../../hooks/useStorage';
import { exportToCSV, exportToJSON, generateSummary } from '../../utils/exportData';

const CATEGORIES = [
  { id: "dairy", name: "Latticini", color: "#fff8e1", icon: "🥛" },
  { id: "vegetables", name: "Verdure", color: "#e8f5e9", icon: "🥬" },
  { id: "meat", name: "Carne", color: "#ffebee", icon: "🥩" },
  { id: "fish", name: "Pesce", color: "#e3f2fd", icon: "🐟" },
  { id: "frozen", name: "Surgelati", color: "#f3e5f5", icon: "❄️" },
  { id: "beverages", name: "Bevande", color: "#e0f2f1", icon: "🥤" },
  { id: "other", name: "Altro", color: "#f5f5f5", icon: "📦" },
];

export default function Stats() {
  const { data: fridge } = useStorage<Item[]>("fridge", []);
  const { data: freezer } = useStorage<Item[]>("freezer", []);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const allItems = [...fridge, ...freezer];

  const handleExport = async (format: 'json' | 'csv' | 'summary') => {
    try {
      let content: string;
      let filename: string;

      switch (format) {
        case 'json':
          content = exportToJSON(fridge, freezer);
          filename = `frigo-backup-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'csv':
          content = exportToCSV(fridge, freezer);
          filename = `frigo-dati-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'summary':
          content = generateSummary(fridge, freezer);
          filename = `frigo-riepilogo-${new Date().toISOString().split('T')[0]}.txt`;
          break;
      }

      await Share.share({
        message: content,
        title: `Backup Frigo - ${filename}`,
      });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare i dati');
    }
  };

  const getCategoryStats = () => {
    const stats = CATEGORIES.map(category => {
      const items = allItems.filter(item => item.category === category.id);
      const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
      return {
        ...category,
        count: items.length,
        totalQty,
      };
    });
    return stats.filter(stat => stat.count > 0);
  };

  const parseDate = (dateString: string) => {
    try {
      // Converte da DD-MM-YYYY a Date
      const [day, month, year] = dateString.split('-');
      if (!day || !month || !year) return null;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch (error) {
      return null;
    }
  };

  const getExpiryStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expired = allItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = parseDate(item.expiryDate);
      if (!expiry) return false;
      expiry.setHours(0, 0, 0, 0);
      return expiry < today;
    });

    const expiringSoon = allItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = parseDate(item.expiryDate);
      if (!expiry) return false;
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    const expiringThisWeek = allItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = parseDate(item.expiryDate);
      if (!expiry) return false;
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    return {
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      expiringThisWeek: expiringThisWeek.length,
      totalWithExpiry: allItems.filter(item => item.expiryDate).length,
    };
  };

  const categoryStats = getCategoryStats();
  const expiryStats = getExpiryStats();

  const StatCard = ({ title, value, subtitle, color = "#0077cc" }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistiche</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => setShowExportOptions(!showExportOptions)}
        >
          <Text style={styles.exportBtnText}>📤 Export</Text>
        </TouchableOpacity>
      </View>

      {showExportOptions && (
        <View style={styles.exportOptions}>
          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExport('json')}
          >
            <Text style={styles.exportOptionText}>📄 Backup JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExport('csv')}
          >
            <Text style={styles.exportOptionText}>📊 Dati CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportOption}
            onPress={() => handleExport('summary')}
          >
            <Text style={styles.exportOptionText}>📋 Riepilogo</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistiche generali */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Panoramica</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Totale Prodotti"
              value={allItems.length}
              subtitle="nel frigo e freezer"
              color="#4caf50"
            />
            <StatCard
              title="Frigo"
              value={fridge.length}
              subtitle="prodotti"
              color="#2196f3"
            />
            <StatCard
              title="Freezer"
              value={freezer.length}
              subtitle="prodotti"
              color="#00bcd4"
            />
            <StatCard
              title="Con Scadenza"
              value={expiryStats.totalWithExpiry}
              subtitle="prodotti"
              color="#ff9800"
            />
          </View>
        </View>

        {/* Statistiche scadenze */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scadenze</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Scaduti"
              value={expiryStats.expired}
              subtitle="prodotti"
              color="#e53935"
            />
            <StatCard
              title="Scadono Presto"
              value={expiryStats.expiringSoon}
              subtitle="entro 3 giorni"
              color="#ff9800"
            />
            <StatCard
              title="Questa Settimana"
              value={expiryStats.expiringThisWeek}
              subtitle="entro 7 giorni"
              color="#ffc107"
            />
          </View>
        </View>

        {/* Statistiche per categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per Categoria</Text>
          {categoryStats.map((stat) => (
            <View key={stat.id} style={styles.categoryStat}>
              <View style={styles.categoryStatHeader}>
                <Text style={styles.categoryIcon}>{stat.icon}</Text>
                <Text style={styles.categoryName}>{stat.name}</Text>
                <View style={styles.categoryStatValues}>
                  <Text style={styles.categoryCount}>{stat.count} prodotti</Text>
                  <Text style={styles.categoryQty}>{stat.totalQty} unità</Text>
                </View>
              </View>
              <View style={[styles.categoryBar, { backgroundColor: stat.color }]}>
                <View 
                  style={[
                    styles.categoryBarFill, 
                    { 
                      width: `${(stat.count / Math.max(...categoryStats.map(s => s.count))) * 100}%`,
                      backgroundColor: stat.color,
                      opacity: 0.7,
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Prodotti in scadenza */}
        {expiryStats.expired > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prodotti Scaduti</Text>
            {allItems
              .filter(item => {
                if (!item.expiryDate) return false;
                const expiry = parseDate(item.expiryDate);
                if (!expiry) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                expiry.setHours(0, 0, 0, 0);
                return expiry < today;
              })
              .map((item) => (
                <View key={item.id} style={styles.expiredItem}>
                  <Text style={styles.expiredItemName}>{item.name}</Text>
                  <Text style={styles.expiredItemDate}>
                    Scaduto il {item.expiryDate}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0faff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  exportBtn: {
    backgroundColor: "#0077cc",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  exportOptions: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  categoryStat: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  categoryStatValues: {
    alignItems: "flex-end",
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  categoryQty: {
    fontSize: 12,
    color: "#666",
  },
  categoryBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  expiredItem: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#e53935",
  },
  expiredItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  expiredItemDate: {
    fontSize: 12,
    color: "#e53935",
    marginTop: 2,
  },
});
