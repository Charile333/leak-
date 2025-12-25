export interface LeakedCredential {
  id: string;
  email: string;
  username: string;
  password_plaintext: string;
  password_hash: string;
  hash_type: string;
  website: string;
  source: string;
  leaked_at: string;
  type: 'Employee' | 'Third-Party' | 'Customer';
  strength: 'Strong' | 'Medium' | 'Weak' | 'Very Weak';
  ip_address?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
}

export interface DomainSearchSummary {
  domain: string;
  total: number;
  employees: {
    count: number;
    strength: Record<string, number>;
  };
  third_parties: {
    count: number;
    strength: Record<string, number>;
  };
  customers: {
    count: number;
    strength: Record<string, number>;
  };
}

const SOURCES = ['RedLine Stealer', 'Vidar Stealer', 'Raccoon Stealer', 'Genesis Market', 'Exploit.in', 'Anti Public'];
const HASH_TYPES = ['MD5', 'SHA-1', 'SHA-256', 'Bcrypt'];

export const mockDataService = {
  searchDomain: async (domain: string): Promise<{ summary: DomainSearchSummary, credentials: LeakedCredential[] }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const totalRecords = Math.floor(Math.random() * 200) + 50;
    const empCount = Math.floor(totalRecords * 0.05);
    const thirdPartyCount = Math.floor(totalRecords * 0.1);
    const customerCount = totalRecords - empCount - thirdPartyCount;

    const summary: DomainSearchSummary = {
      domain,
      total: totalRecords,
      employees: {
        count: empCount,
        strength: { strong: 2, medium: 3, weak: 0, very_weak: 0 }
      },
      third_parties: {
        count: thirdPartyCount,
        strength: { strong: 5, medium: 8, weak: 2, very_weak: 0 }
      },
      customers: {
        count: customerCount,
        strength: { strong: 40, medium: 60, weak: 20, very_weak: 5 }
      }
    };

    const credentials: LeakedCredential[] = Array.from({ length: 50 }).map((_, i) => {
      const type = i < 5 ? 'Employee' : i < 15 ? 'Third-Party' : 'Customer';
      const strength = (['Strong', 'Medium', 'Weak', 'Very Weak'][Math.floor(Math.random() * 4)]) as LeakedCredential['strength'];
      
      return {
        id: `leak-${i}`,
        email: `user${i}@${domain}`,
        username: `user_${i}`,
        password_plaintext: Math.random() > 0.3 ? `pass****${Math.random().toString(36).substring(7)}` : '********',
        password_hash: Math.random().toString(16).substring(2, 34),
        hash_type: HASH_TYPES[Math.floor(Math.random() * HASH_TYPES.length)],
        website: `https://portal.${domain}`,
        source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
        leaked_at: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
        type,
        strength,
        ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      };
    });

    return { summary, credentials };
  }
};
