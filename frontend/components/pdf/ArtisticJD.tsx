import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Artistic Style tokens
export const getStyles = (branding: any = {}, templateId: string = 'corporate') => {
  const primaryColor = branding.primaryColor || '#2563EB';
  const secondaryColor = branding.secondaryColor || '#F8FAFC';
  
  return StyleSheet.create({
    page: {
      padding: 50,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
    },
    header: {
      marginBottom: 30,
      borderBottomWidth: templateId === 'executive' ? 2 : 0,
      borderBottomColor: primaryColor,
      paddingBottom: 15,
      textAlign: branding.logoAlignment === 'center' ? 'center' : 'left',
    },
    logo: {
      height: 40,
      width: 'auto',
      marginBottom: 10,
      alignSelf: branding.logoAlignment === 'center' ? 'center' : 'flex-start',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: templateId === 'startup' ? primaryColor : '#0f172a',
      marginBottom: 5,
    },
    metaBar: {
      flexDirection: 'row',
      backgroundColor: secondaryColor,
      borderRadius: 8,
      padding: 12,
      marginBottom: 25,
      justifyContent: 'space-between',
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 8,
      textTransform: 'uppercase',
      color: '#64748b',
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#1e293b',
    },
    section: {
      marginBottom: 20,
      padding: templateId === 'startup' ? 15 : 0,
      backgroundColor: templateId === 'startup' ? secondaryColor : 'transparent',
      borderRadius: 8,
      borderLeftWidth: templateId === 'minimal' ? 4 : 0,
      borderLeftColor: primaryColor,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: primaryColor,
      marginBottom: 8,
      letterSpacing: 1,
    },
    text: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#334155',
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bullet: {
      width: 10,
      fontSize: 10,
    },
    listContent: {
      flex: 1,
      fontSize: 10,
      color: '#334155',
    }
  });
};

const Section = ({ title, content, styles }: any) => {
  if (!content || (typeof content === 'string' && content.trim() === '')) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {Array.isArray(content) ? (
        content.map((item: any, i: number) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listContent}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.text}>{content}</Text>
      )}
    </View>
  );
};

export const ArtisticJD = ({ job, branding, templateId }: any) => {
  const styles = getStyles(branding, templateId);
  const sections = job?.content?.sections || {};

  // Fuzzy Extraction
  const getFuzzy = (keys: string[], fallback: string) => {
     for(const k of keys) {
        if(sections[k]) return sections[k];
        const found = Object.keys(sections).find(sk => sk.toLowerCase().includes(k.toLowerCase()));
        if(found) return sections[found];
     }
     return fallback;
  }

  const location = getFuzzy(["Location", "Place"], "Hybrid / Remote Available");
  const experience = getFuzzy(["Experience", "Years", "Reqs"], "Relevant Industry Experience");
  const mode = getFuzzy(["Mode", "Type"], "Full-Time - Bangalore");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {branding?.logoUrl && (
            <Image src={branding.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.title}>{job.title}</Text>
        </View>

        {/* Metadata Bar */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Experience</Text>
            <Text style={styles.metaValue}>{experience}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Working Mode</Text>
            <Text style={styles.metaValue}>{mode}</Text>
          </View>
        </View>

        {/* Body Content */}
        <Section title="About Company" content={getFuzzy(["About Company", "About Wissen", "Profile"], "")} styles={styles} />
        <Section title="Job Summary" content={getFuzzy(["Summary", "Overview", "Role"], "")} styles={styles} />
        <Section title="Key Responsibilities" content={getFuzzy(["Responsibilities", "Tasks", "Do"], "")} styles={styles} />
        <Section title="Qualifications" content={getFuzzy(["Qualifications", "Requirements", "Skills"], "")} styles={styles} />
        <Section title="Good to Have" content={getFuzzy(["Good", "Nice", "Preferred"], "")} styles={styles} />
      </Page>
    </Document>
  );
};
