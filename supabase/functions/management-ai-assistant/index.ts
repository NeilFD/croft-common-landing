import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FUNCTION_VERSION = 'management-ai-assistant-2025-10-02-01';
console.log(`🚀 management-ai-assistant booted: ${FUNCTION_VERSION}`);

// ============= DATABASE SCHEMA CONSTANTS =============
// Define exact column names from database to prevent typos
const SCHEMA = {
  feedback_submissions: {
    id: 'id',
    user_id: 'user_id',
    name: 'name',
    email: 'email',
    message: 'message',
    is_anonymous: 'is_anonymous',
    source_page: 'source_page',
    hospitality_rating: 'hospitality_rating',
    food_rating: 'food_rating',
    drink_rating: 'drink_rating',
    team_rating: 'team_rating',
    venue_rating: 'venue_rating',
    price_rating: 'price_rating',
    overall_rating: 'overall_rating',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },
  events: {
    id: 'id',
    user_id: 'user_id',
    title: 'title',
    description: 'description',
    date: 'date',
    time: 'time',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },
  bookings: {
    id: 'id',
    space_id: 'space_id',
    lead_id: 'lead_id',
    event_id: 'event_id',
    title: 'title',
    start_ts: 'start_ts',
    end_ts: 'end_ts',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at'
  },
  contracts: {
    id: 'id',
    event_id: 'event_id',
    version: 'version',
    content: 'content',
    is_signed: 'is_signed',
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
} as const;

// ============= INTENT DETECTION & EVENT RESOLUTION =============

interface Intent {
  type: 'menu' | 'beo' | 'pdf' | 'schedule' | 'staffing' | 'equipment' | 'contract' | 'knowledge' | 'document' | 'policy' | 'procedure' | 'feedback' | 'reviews' | 'general';
  eventIdentifier?: string;
  searchQuery?: string;
  confidence: number;
}

function detectIntent(message: string, conversationHistory: any[] = []): Intent {
  const lower = message.toLowerCase();
  
  // Feedback/Reviews intent detection (check first for specificity)
  if (/\b(feedback|review|reviews|rating|ratings|satisfaction|customer|guest|score|scores|sentiment|comment|comments|testimonial|testimonials|average rating|average score)\b/i.test(lower)) {
    return { type: 'feedback', searchQuery: message, confidence: 0.95 };
  }
  
  // Common Knowledge intent detection (check first for specificity)
  if (/\b(policy|policies|procedure|procedures|guideline|guidelines|handbook|documentation|training|sop|standard operating|protocol)\b/i.test(lower)) {
    return { type: 'policy', searchQuery: message, confidence: 0.95 };
  }
  
  if (/\b(knowledge|document|documents|manual|guide|reference|wiki|info|information about|how to|what.?s our|what are our|what are the|what is the|principle|principles|value|values|ethos|hospitality|croft common|plan|plans|strategy|strategic|roadmap|playbook|brief|handbook|sop|standard operating|marketing|marketing plan)\b/i.test(lower)) {
    return { type: 'knowledge', searchQuery: message, confidence: 0.92 };
  }
  
  // Menu intent detection
  if (/\b(menu|dish|food|drink|course|starter|main|dessert|allergen)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'menu', eventIdentifier: eventId, confidence: 0.9 };
  }
  
  // BEO/PDF intent detection
  if (/\b(beo|banquet.?event.?order|pdf|send.?me|download)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'beo', eventIdentifier: eventId, confidence: 0.9 };
  }
  
  // Schedule intent detection
  if (/\b(schedule|timing|timeline|when|time|agenda)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'schedule', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // Staffing intent detection
  if (/\b(staff|team|role|who.?work)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'staffing', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // Equipment intent detection
  if (/\b(equipment|av|audio|visual|setup|hire)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'equipment', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // Contract intent detection
  if (/\b(contract|agreement|sign|signature)\b/i.test(lower)) {
    const eventId = extractEventIdentifier(message, conversationHistory);
    return { type: 'contract', eventIdentifier: eventId, confidence: 0.8 };
  }
  
  // General fallback
  const eventId = extractEventIdentifier(message, conversationHistory);
  return { type: 'general', eventIdentifier: eventId, confidence: 0.5 };
}

function extractEventIdentifier(message: string, conversationHistory: any[] = []): string | undefined {
  // Improved event code pattern - more flexible
  const codeMatch = message.match(/\b(event\s*(?:no\.?|number|#)?\s*)?(?:20\d{2}\d{3})\b/i);
  if (codeMatch) {
    const extractedCode = codeMatch[0].match(/20\d{2}\d{3}/);
    if (extractedCode) {
      console.log(`✓ Found explicit event code: ${extractedCode[0]}`);
      return extractedCode[0];
    }
  }
  
  // Try to extract date (e.g., "28 Sep", "the 7th October", "7th of October", "Sept 28")
  const datePatterns = [
    /\b(?:the\s+)?(\d{1,2})\s*(st|nd|rd|th)?\s*(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:the\s+)?(\d{1,2})\b/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      console.log(`✓ Found date reference: ${match[0]}`);
      return match[0];
    }
  }
  
  // Check if message references a previous event ("that event", "this event", "the event")
  const contextReferences = /\b(that|this|the|same)\s+(event|one|booking)\b/i;
  if (contextReferences.test(message) && conversationHistory.length > 0) {
    console.log(`🔍 Detected contextual reference, searching conversation history...`);
    
    // Search last 5 messages for event identifiers
    const recentMessages = conversationHistory.slice(-5).reverse();
    
    for (const msg of recentMessages) {
      if (!msg?.content) continue;
      
      const content = msg.content;
      
      // Look for event codes
      const historyCodeMatch = content.match(/\b(20\d{2}\d{3})\b/);
      if (historyCodeMatch) {
        console.log(`✓ Found event code in history: ${historyCodeMatch[1]}`);
        return historyCodeMatch[1];
      }
      
      // Look for dates
      for (const pattern of datePatterns) {
        const historyDateMatch = content.match(pattern);
        if (historyDateMatch) {
          console.log(`✓ Found date in history: ${historyDateMatch[0]}`);
          return historyDateMatch[0];
        }
      }
    }
    
    console.log(`✗ No event identifier found in conversation history`);
  }
  
  // Return undefined if no identifier found
  return undefined;
}

async function resolveEvent(supabase: any, identifier: string): Promise<string | null> {
  // First try exact code match
  if (/^20\d{2}\d{3}$/.test(identifier)) {
    const { data } = await supabase
      .from('management_events')
      .select('id')
      .eq('code', identifier)
      .maybeSingle();
    
    if (data) {
      console.log(`✓ Event resolved by code: ${identifier} -> ${data.id}`);
      return data.id;
    }
  }
  
  // Try date match
  if (/\d/.test(identifier)) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Parse the date string and try current and next year
      const dateStr = identifier.toLowerCase();
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      
      let targetDate: Date | null = null;
      
      // Try "28 Sep" format
      const match1 = dateStr.match(/(\d{1,2})\s*(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      if (match1) {
        const day = parseInt(match1[1]);
        const monthName = match1[3].toLowerCase().substring(0, 3);
        const month = months[monthName];
        targetDate = new Date(currentYear, month, day);
        
        // If date is in the past, try next year
        if (targetDate < now) {
          targetDate = new Date(currentYear + 1, month, day);
        }
      }
      
      // Try "Sep 28" format
      const match2 = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})/i);
      if (!targetDate && match2) {
        const monthName = match2[1].toLowerCase().substring(0, 3);
        const month = months[monthName];
        const day = parseInt(match2[2]);
        targetDate = new Date(currentYear, month, day);
        
        if (targetDate < now) {
          targetDate = new Date(currentYear + 1, month, day);
        }
      }
      
      if (targetDate) {
        const dateString = targetDate.toISOString().split('T')[0];
        console.log(`🔍 Searching for events on date: ${dateString}`);
        
        const { data } = await supabase
          .from('management_events')
          .select('id, code, event_type, primary_date')
          .gte('primary_date', dateString)
          .lt('primary_date', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])
          .limit(1)
          .maybeSingle();
        
        if (data) {
          console.log(`✓ Event resolved by date: ${identifier} -> ${data.code} (${data.id})`);
          return data.id;
        }
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }
  }
  
  // Try fuzzy text match on event_type or client_name
  const { data } = await supabase
    .from('management_events')
    .select('id, code, event_type, client_name')
    .or(`event_type.ilike.%${identifier}%,client_name.ilike.%${identifier}%`)
    .limit(1)
    .maybeSingle();
  
  if (data) {
    console.log(`✓ Event resolved by fuzzy match: ${identifier} -> ${data.code} (${data.id})`);
    return data.id;
  }
  
  console.log(`✗ Could not resolve event identifier: ${identifier}`);
  return null;
}

// Helper to recursively get all child folder IDs
async function getAllChildFolderIds(supabase: any, parentIds: string[]): Promise<string[]> {
  if (parentIds.length === 0) return [];
  
  const { data: children } = await supabase
    .from('ck_collections')
    .select('id')
    .in('parent_id', parentIds);
  
  if (!children || children.length === 0) return parentIds;
  
  const childIds = children.map((c: any) => c.id);
  const grandchildIds = await getAllChildFolderIds(supabase, childIds);
  
  return [...parentIds, ...childIds, ...grandchildIds];
}

async function retrieveCommonKnowledgeData(supabase: any, searchQuery: string, serviceRoleClient?: any) {
  // Use service role client for knowledge base queries to bypass RLS
  const dbClient = serviceRoleClient || supabase;
  const retrieved: any = { documents: [], collections: [], totalDocs: 0 };
  
  try {
    console.log('📚 Searching Common Knowledge for:', searchQuery);
    console.log('🧭 Function version:', FUNCTION_VERSION);
    
    // Quick visibility check: count approved docs (no joins)
    const { count: approvedCount, error: approvedCountError } = await dbClient
      .from('ck_docs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');
    console.log(`🧮 Approved docs visible: ${approvedCount ?? 0}${approvedCountError ? ' (count error: ' + approvedCountError.message + ')' : ''}`);
    
    // Synonym expansion for semantic matching
    const synonymMap: Record<string, string[]> = {
      'document': ['plan', 'strategy', 'guide', 'policy', 'procedure', 'doc', 'file'],
      'plan': ['document', 'strategy', 'guide', 'planning'],
      'marketing': ['marketing', 'promotion', 'advertising', 'brand', 'communications'],
      'strategic': ['strategic', 'strategy', 'planning', 'plan'],
      'folder': ['collection', 'directory', 'category', 'section'],
      'menu': ['menu', 'food', 'drink', 'dining', 'catering'],
      'contract': ['contract', 'agreement', 'terms'],
      'staff': ['staff', 'employee', 'team', 'personnel', 'staffing'],
      'venue': ['venue', 'space', 'room', 'location'],
      'fire': ['fire', 'safety', 'emergency'],
      'dietary': ['dietary', 'allergen', 'allergy', 'food']
    };
    
    // Stopwords to filter out from keyword searches
    const stopwords = ['the','and','for','are','but','not','you','can','has','what','when','where','who','how','our','out','any','document','documents','folder','file','files','whats','in','is','it','this','that','show','tell','find','get','give','pull','please','me','could','would','kindly','pls'];
    
    // Extract all words - very permissive
    const allWords = searchQuery.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .filter(w => !stopwords.includes(w));
    
    // Filtered keywords for precise matching (remove stopwords)
    const filteredKeywords = allWords.filter(w => !['document','documents','folder','file','files','whats'].includes(w));
    
    // Expand with synonyms
    const expandedKeywords = new Set(allWords);
    allWords.forEach(word => {
      if (synonymMap[word]) {
        synonymMap[word].forEach(syn => expandedKeywords.add(syn));
      }
    });
    const keywords = Array.from(expandedKeywords);
    
    console.log('🔍 Original words:', allWords);
    console.log('🔍 Filtered keywords (no filler):', filteredKeywords);
    console.log('🔍 Expanded keywords:', keywords);
    
    // STRATEGY 0: Exact phrase and all-keywords-AND on title (highest precision)
    console.log('🎯 Strategy 0: Exact phrase and all-keywords-AND on title...');
    const normalizedQuery = (filteredKeywords.length > 0 ? filteredKeywords.join(' ') : searchQuery.toLowerCase().trim());
    
    // Try exact phrase match on title first
    let { data: exactMatches } = await dbClient
      .from('ck_docs')
      .select(`
        id, title, slug, type, description, tags, zones, collection_id, updated_at,
        ck_collections(name, slug),
        ck_doc_versions!ck_doc_versions_doc_id_fkey(id, content_md, summary, version_no, created_at)
      `)
      .eq('status', 'approved')
      .or(`title.ilike.%${normalizedQuery}%,slug.ilike.%${normalizedQuery}%`)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    console.log(`🔍 Strategy 0a (exact phrase): Found ${exactMatches?.length || 0} matches`);
    if (exactMatches && exactMatches.length > 0) {
      console.log('📋 Exact phrase matches:', exactMatches.map((d: any) => d.title));
    }
    
    // If no exact match, try all-keywords-AND (all FILTERED words must appear in title)
    let allKeywordsMatches: any[] = [];
    let partialMatches: any[] = [];
    
    if (!exactMatches || exactMatches.length === 0) {
      console.log('🔍 Strategy 0b: All-keywords-AND on title (FILTERED keywords only)...');
      console.log('🔍 Looking for ALL these filtered words in title:', filteredKeywords);
      
      // Get ALL approved docs with versions
      const { data: allKeywordDocs } = await dbClient
        .from('ck_docs')
        .select(`
          id, title, slug, type, description, tags, zones, collection_id, updated_at,
          ck_collections(name, slug),
          ck_doc_versions!ck_doc_versions_doc_id_fkey(id, content_md, summary, version_no, created_at)
        `)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false });
      
      console.log(`📊 Retrieved ${allKeywordDocs?.length || 0} total approved documents`);
      
      if (allKeywordDocs && allKeywordDocs.length > 0) {
        // Filter to docs where ALL FILTERED keywords appear in title
        allKeywordsMatches = allKeywordDocs.filter((doc: any) => {
          const titleLower = doc.title.toLowerCase();
          return filteredKeywords.every(word => titleLower.includes(word));
        });
        
        console.log(`🎯 ALL-keywords-AND: Found ${allKeywordsMatches.length} matches`);
        if (allKeywordsMatches.length > 0) {
          console.log('📋 ALL-keywords matches:', allKeywordsMatches.slice(0, 3).map((d: any) => d.title));
        }
        
        // Strategy 0c: Partial match (at least 75% of filtered keywords)
        if (allKeywordsMatches.length === 0 && filteredKeywords.length >= 2) {
          console.log('🔍 Strategy 0c: Partial match (75% threshold)...');
          const threshold = Math.ceil(filteredKeywords.length * 0.5);
          console.log(`🔍 Need at least ${threshold} of ${filteredKeywords.length} keywords`);
          
          partialMatches = allKeywordDocs.map((doc: any) => {
            const titleLower = doc.title.toLowerCase();
            const matchCount = filteredKeywords.filter(word => titleLower.includes(word)).length;
            const matchPercent = (matchCount / filteredKeywords.length) * 100;
            
            return {
              doc,
              matchCount,
              matchPercent,
              meetsThreshold: matchCount >= threshold
            };
          })
          .filter(item => item.meetsThreshold)
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 10);
          
          console.log(`🎯 Partial match: Found ${partialMatches.length} documents meeting threshold`);
          if (partialMatches.length > 0) {
            console.log('📋 Partial matches:', partialMatches.slice(0, 3).map((item: any) => 
              `"${item.doc.title}" (${item.matchCount}/${filteredKeywords.length} keywords)`
            ));
          }
        }
      }
    }
    
    // Score and collect Strategy 0 results
    let strategy0Results: any[] = [];
    
    if (exactMatches && exactMatches.length > 0) {
      console.log(`✅ Strategy 0a: Found ${exactMatches.length} exact phrase matches`);
      strategy0Results = exactMatches.map((doc: any) => ({
        doc,
        score: 100, // Highest score for exact phrase
        matchReason: 'exact_phrase_match'
      }));
    } else if (allKeywordsMatches.length > 0) {
      console.log(`✅ Strategy 0b: Found ${allKeywordsMatches.length} ALL-keywords matches`);
      strategy0Results = allKeywordsMatches.map((doc: any) => ({
        doc,
        score: 80, // High score for all keywords
        matchReason: 'all_keywords_match'
      }));
    } else if (partialMatches.length > 0) {
      console.log(`✅ Strategy 0c: Found ${partialMatches.length} partial matches`);
      strategy0Results = partialMatches.map((item: any) => ({
        doc: item.doc,
        score: 60 + (item.matchPercent * 0.2), // 60-80 based on match percentage
        matchReason: `partial_match_${item.matchCount}_of_${filteredKeywords.length}`
      }));
    }
    
    // Only return early if we have high-confidence exact matches
    if (strategy0Results.length > 0 && strategy0Results[0].score >= 100) {
      console.log('🎯 High confidence exact match found, returning immediately');
      retrieved.documents = strategy0Results.map(({ doc, score, matchReason }: any) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        description: doc.description,
        tags: doc.tags,
        zones: doc.zones,
        collection: doc.ck_collections?.name,
        content_full: doc.ck_doc_versions[0]?.content_md || '',
        content: doc.ck_doc_versions[0]?.content_md || '',
        summary: doc.ck_doc_versions[0]?.summary,
        slug: doc.slug,
        matchReason,
        score
      }));
      retrieved.totalDocs = strategy0Results.length;
      retrieved.searchMethod = 'exact_phrase_match';
      
      // Get all folders for context
      const { data: collections } = await dbClient
        .from('ck_collections')
        .select('id, name, slug, parent_id')
        .order('name');
      retrieved.collections = collections || [];
      
      console.log('🏆 Top results:', retrieved.documents.slice(0, 3).map((d: any) => `"${d.title}" (score: ${d.score})`));
      
      return retrieved;
    }
    
    // Otherwise, continue collecting results from other strategies
    if (strategy0Results.length > 0) {
      console.log(`📋 Strategy 0 found ${strategy0Results.length} results, continuing to merge with other strategies...`);
    }
    
    // STRATEGY 1: Folder name match with recursive hierarchy
    console.log('🗂️ Strategy 1: Searching folder names (with hierarchy)...');
    console.log('🔍 Searching for keywords in folder names:', keywords);
    
    const { data: collectionResults } = await dbClient
      .from('ck_collections')
      .select('id, name, slug, parent_id')
      .or(keywords.map(k => `name.ilike.%${k}%,slug.ilike.%${k}%`).join(','))
      .limit(20);
    
    console.log(`📊 Retrieved ${collectionResults?.length || 0} folders from database`);
    
    if (collectionResults && collectionResults.length > 0) {
      console.log(`✅ Found ${collectionResults.length} matching folders:`, collectionResults.map((c: any) => c.name));
      
      // Get all child folders recursively
      const rootFolderIds = collectionResults.map((c: any) => c.id);
      const allFolderIds = await getAllChildFolderIds(dbClient, rootFolderIds);
      
      console.log(`🔍 Including ${allFolderIds.length} folders (with subfolders)`);
      
      // Get all documents in these folders and subfolders
      const { data: folderDocs } = await dbClient
        .from('ck_docs')
        .select(`
          id, title, slug, type, description, tags, zones, collection_id, updated_at,
          ck_collections(name, slug, parent_id),
          ck_doc_versions!ck_doc_versions_doc_id_fkey(id, content_md, summary, version_no, created_at)
        `)
        .eq('status', 'approved')
        .in('collection_id', allFolderIds)
        .order('updated_at', { ascending: false })
        .limit(25);
      
      if (folderDocs && folderDocs.length > 0) {
        console.log(`✅ Found ${folderDocs.length} documents in matching folders (including subfolders)`);
        
        // Score and sort results
        const scoredDocs = folderDocs.map((doc: any) => {
          let score = 0;
          const titleLower = doc.title.toLowerCase();
          const descLower = (doc.description || '').toLowerCase();
          
          // Higher score for matching keywords in title
          allWords.forEach(word => {
            if (titleLower.includes(word)) score += 10;
            if (descLower.includes(word)) score += 3;
          });
          
          // Boost for exact folder match
          const isRootFolder = rootFolderIds.includes(doc.collection_id);
          if (isRootFolder) score += 20;
          
          // Recent docs get slight boost
          const daysSinceUpdate = (Date.now() - new Date(doc.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate < 30) score += 2;
          
          return { doc, score };
        });
        
        scoredDocs.sort((a, b) => b.score - a.score);
        
        retrieved.documents = scoredDocs.slice(0, 20).map(({ doc, score }: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          description: doc.description,
          tags: doc.tags,
          zones: doc.zones,
          collection: doc.ck_collections?.name,
          content_full: doc.ck_doc_versions[0]?.content_md || '',
          content: doc.ck_doc_versions[0]?.content_md || '',
          summary: doc.ck_doc_versions[0]?.summary,
          slug: doc.slug,
          matchReason: 'folder_match',
          score
        }));
        retrieved.totalDocs = scoredDocs.length;
        retrieved.searchMethod = 'folder_hierarchy_match';
        retrieved.collections = collectionResults;
        retrieved.folderContext = `${collectionResults.length} folders (${allFolderIds.length} including subfolders)`;
        return retrieved;
      }
    }
    
    // STRATEGY 2: Document title + description (WITHOUT joined filter issues)
    console.log('📝 Strategy 2: Searching document titles + descriptions...');
    console.log('🔍 Searching for ANY keyword in title/description:', keywords);
    
    // Search titles and descriptions separately to avoid PostgREST join filter issues
    const titleOrFilters = keywords.map(k => `title.ilike.%${k}%`).join(',');
    const descOrFilters = keywords.map(k => `description.ilike.%${k}%`).join(',');
    
    console.log('🔍 Title filters:', titleOrFilters.substring(0, 100) + '...');
    
    const { data: titleResults } = await dbClient
      .from('ck_docs')
      .select(`
        id, title, slug, type, description, tags, zones, collection_id, updated_at,
        ck_collections(name, slug),
        ck_doc_versions!ck_doc_versions_doc_id_fkey(id, content_md, summary, version_no, created_at)
      `)
      .eq('status', 'approved')
      .or(`${titleOrFilters},${descOrFilters}`)
      .order('updated_at', { ascending: false })
      .limit(20);
    
    console.log(`📊 Strategy 2 retrieved ${titleResults?.length || 0} documents`);
    
    if (titleResults && titleResults.length > 0) {
      console.log(`✅ Found ${titleResults.length} documents by title/description`);
      console.log('📋 Sample results:', titleResults.slice(0, 3).map((d: any) => d.title));
      
      // Score results with improved algorithm
      const scoredResults = titleResults.map((doc: any) => {
        let score = 0;
        const titleLower = doc.title.toLowerCase();
        const descLower = (doc.description || '').toLowerCase();
        
        // Exact phrase match bonus
        if (titleLower.includes(normalizedQuery)) {
          score += 50;
        }
        
        // Count filtered keyword matches (high value)
        const titleMatches = filteredKeywords.filter(word => titleLower.includes(word)).length;
        const descMatches = filteredKeywords.filter(word => descLower.includes(word)).length;
        
        score += titleMatches * 15;
        score += descMatches * 5;
        
        // Keyword density bonus (all filtered keywords in title)
        if (filteredKeywords.length > 0) {
          const titleDensity = titleMatches / filteredKeywords.length;
          if (titleDensity === 1.0) score += 40; // All keywords
          else if (titleDensity >= 0.75) score += 20; // Most keywords
        }
        
        // Penalize very generic single-word matches
        if (titleMatches === 1 && filteredKeywords.length > 1) {
          score -= 10;
        }
        
        // Recency boost
        const daysSinceUpdate = (Date.now() - new Date(doc.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) score += 5;
        
        return { doc, score, titleMatches, descMatches };
      });
      
      scoredResults.sort((a, b) => b.score - a.score);
      
      console.log('🏆 Top Strategy 2 results:', scoredResults.slice(0, 3).map((item: any) => 
        `"${item.doc.title}" (score: ${item.score}, title: ${item.titleMatches}/${filteredKeywords.length}, desc: ${item.descMatches}/${filteredKeywords.length})`
      ));
      
      retrieved.documents = scoredResults.slice(0, 15).map(({ doc, score }: any) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        description: doc.description,
        tags: doc.tags,
        zones: doc.zones,
        collection: doc.ck_collections?.name,
        content_full: doc.ck_doc_versions[0]?.content_md || '',
        content: doc.ck_doc_versions[0]?.content_md || '',
        summary: doc.ck_doc_versions[0]?.summary,
        slug: doc.slug,
        matchReason: 'title_description_match',
        score
      }));
      
      // Merge with Strategy 0 results if we have any
      if (strategy0Results.length > 0) {
        console.log('🔀 Merging Strategy 0 and Strategy 2 results...');
        const allResults = [...strategy0Results, ...scoredResults];
        
        // Deduplicate by doc ID
        const seen = new Set();
        const uniqueResults = allResults.filter(item => {
          const id = item.doc.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        
        // Sort by score
        uniqueResults.sort((a, b) => b.score - a.score);
        
        retrieved.documents = uniqueResults.slice(0, 15).map(({ doc, score, matchReason }: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          description: doc.description,
          tags: doc.tags,
          zones: doc.zones,
          collection: doc.ck_collections?.name,
          content_full: doc.ck_doc_versions[0]?.content_md || '',
          content: doc.ck_doc_versions[0]?.content_md || '',
          summary: doc.ck_doc_versions[0]?.summary,
          slug: doc.slug,
          matchReason: matchReason || 'title_description_match',
          score
        }));
        
        console.log('🏆 Final merged results:', retrieved.documents.slice(0, 3).map((d: any) => 
          `"${d.title}" (score: ${d.score}, reason: ${d.matchReason})`
        ));
      }
      
      retrieved.totalDocs = retrieved.documents.length;
      retrieved.searchMethod = strategy0Results.length > 0 ? 'merged_strategies' : 'title_description_match';
      
      // Get all folders for context
      const { data: collections } = await dbClient
        .from('ck_collections')
        .select('id, name, slug')
        .order('name');
      retrieved.collections = collections || [];
      
      return retrieved;
    }
    
    // STRATEGY 3: Full-text search (now includes titles!)
    console.log('🔍 Strategy 3: Full-text search (with titles)...');
    const searchTerms = keywords.join(' | '); // OR search
    
    const { data: docs, error: docsError } = await dbClient
      .from('ck_doc_versions')
      .select(`
        id,
        doc_id,
        content_md,
        summary,
        version_no,
        created_at,
        ck_docs!ck_doc_versions_doc_id_fkey (
          id,
          title,
          slug,
          type,
          status,
          tags,
          zones,
          description,
          collection_id,
          ck_collections (
            id,
            name,
            slug
          )
        )
      `)
      .eq('ck_docs.status', 'approved')
      .textSearch('search_text', searchTerms, { type: 'websearch' })
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (docsError) {
      console.warn('Full-text search error:', docsError.message);
    } else if (docs && docs.length > 0) {
      console.log(`✓ Found ${docs.length} documents via full-text search`);
      retrieved.documents = docs.map((version: any) => ({
        id: version.ck_docs.id,
        title: version.ck_docs.title,
        type: version.ck_docs.type,
        description: version.ck_docs.description,
        tags: version.ck_docs.tags,
        zones: version.ck_docs.zones,
        collection: version.ck_docs.ck_collections?.name,
        content_full: version.content_md || '',
        content: version.content_md || '',
        summary: version.summary,
        slug: version.ck_docs.slug,
      }));
      retrieved.totalDocs = docs.length;
      retrieved.searchMethod = 'fulltext_match';
    }
    
    // STRATEGY 4: Content search as last resort
    if (retrieved.documents.length === 0 && keywords.length > 0) {
      console.log('🔎 Trying content search as last resort...');
      const { data: contentDocs } = await dbClient
        .from('ck_docs')
        .select(`
          id,
          title,
          slug,
          type,
          description,
          tags,
          zones,
          collection_id,
          ck_collections (
            id,
            name,
            slug
          ),
          ck_doc_versions!inner (
            id,
            content_md,
            summary,
            version_no,
            created_at
          )
        `)
        .eq('status', 'approved')
        .or(keywords.map(k => `ck_doc_versions.content_md.ilike.%${k}%`).join(','))
        .order('updated_at', { ascending: false })
        .limit(10);
      
      if (contentDocs && contentDocs.length > 0) {
        console.log(`✓ Content search found ${contentDocs.length} documents`);
        retrieved.documents = contentDocs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          description: doc.description,
          tags: doc.tags,
          zones: doc.zones,
          collection: doc.ck_collections?.name,
          content_full: doc.ck_doc_versions[0]?.content_md || '',
          content: doc.ck_doc_versions[0]?.content_md || '',
          summary: doc.ck_doc_versions[0]?.summary,
          slug: doc.slug,
        }));
        retrieved.totalDocs = contentDocs.length;
        retrieved.searchMethod = 'content_match';
      }
    }
    
    // Get all collections for context
    const { data: collections } = await dbClient
      .from('ck_collections')
      .select('id, name, slug')
      .order('name');
    
    retrieved.collections = collections || [];
    retrieved.totalDocs = retrieved.documents.length;
    
    console.log(`✓ Found ${retrieved.totalDocs} relevant documents`);
    
  } catch (error) {
    console.error('Error retrieving Common Knowledge data:', error);
  }
  
  return retrieved;
}

async function retrieveTargetedData(supabase: any, intent: Intent, eventId: string | null, timePeriod?: string, dateRange?: { start_date?: string; end_date?: string }, filters?: any, serviceRoleClient?: any) {
  const retrieved: any = { intent: intent.type };
  
  // Handle Event listing intent (when no specific event ID but want to list events)
  if (intent.type === 'event' && !eventId && filters) {
    try {
      console.log('📅 Retrieving events with filters:', filters);
      
      let query = supabase
        .from('events')
        .select(`
          id, event_code, event_date, client_name, event_type, attendee_count, 
          status, total_value, venue_name, primary_contact_name, primary_contact_email,
          lead_id
        `)
        .order('event_date', { ascending: true });
      
      // Apply status filter
      if (filters.status) {
        if (filters.status === 'upcoming') {
          const today = new Date().toISOString().split('T')[0];
          query = query.gte('event_date', today).in('status', ['definite', 'provisional']);
        } else {
          query = query.eq('status', filters.status);
        }
      }
      
      // Apply date range filter
      if (filters.date_range) {
        if (filters.date_range.start_date) {
          query = query.gte('event_date', filters.date_range.start_date);
        }
        if (filters.date_range.end_date) {
          query = query.lte('event_date', filters.date_range.end_date);
        }
      }
      
      // Limit results
      query = query.limit(50);
      
      const { data: events, error } = await query;
      
      if (error) {
        console.error('Error retrieving events:', error);
      } else if (events && events.length > 0) {
        console.log(`✅ Retrieved ${events.length} events`);
        retrieved.events = events;
        retrieved.event_count = events.length;
      } else {
        console.log('📅 No events found matching filters');
        retrieved.events = [];
        retrieved.event_count = 0;
        retrieved.message = 'No events found matching the specified criteria.';
      }
    } catch (error) {
      console.error('Error in event listing:', error);
    }
    
    return retrieved;
  }
  
  // Handle Feedback/Reviews intent (no event needed)
  if (intent.type === 'feedback' || intent.type === 'reviews') {
    try {
      // Calculate date filter based on time period (supports start/end bounds)
      let startISO: string | null = null;
      let endISO: string | null = null;
      const now = new Date();
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      
      if (timePeriod) {
        switch (timePeriod) {
          case 'today': {
            const start = startOfDay(now);
            startISO = start.toISOString();
            endISO = new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString();
            break;
          }
          case 'yesterday': {
            const start = new Date(startOfDay(now).getTime() - 24 * 60 * 60 * 1000);
            startISO = start.toISOString();
            endISO = new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString();
            break;
          }
          case 'week':
            startISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'month':
            startISO = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'quarter':
            startISO = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'year':
            startISO = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'all_time':
          default:
            startISO = null;
            endISO = null;
        }
      }

      // Honour explicit date range if provided via filters
      if (dateRange && (dateRange.start_date || dateRange.end_date)) {
        try {
          if (dateRange.start_date) {
            const s = new Date(dateRange.start_date);
            if (!isNaN(s.getTime())) startISO = s.toISOString();
          }
          if (dateRange.end_date) {
            // make end exclusive by adding one day
            const e = new Date(dateRange.end_date);
            if (!isNaN(e.getTime())) endISO = new Date(e.getTime() + 24 * 60 * 60 * 1000).toISOString();
          }
        } catch (e) {
          console.warn('Invalid date_range provided to feedback analytics:', dateRange, e);
        }
      }

      console.log(`🗓️ Feedback date window => startISO: ${startISO || 'none'} | endISO: ${endISO || 'none'}`);
      const feedbackCols = SCHEMA.feedback_submissions;
      let query = supabase
        .from('feedback_submissions')
        .select(`${feedbackCols.overall_rating}, ${feedbackCols.hospitality_rating}, ${feedbackCols.food_rating}, ${feedbackCols.drink_rating}, ${feedbackCols.team_rating}, ${feedbackCols.venue_rating}, ${feedbackCols.price_rating}, ${feedbackCols.is_anonymous}, ${feedbackCols.message}, ${feedbackCols.created_at}`)
        .order(feedbackCols.created_at, { ascending: false });
      
      // Apply date filters if specified
      if (startISO) {
        query = query.gte(feedbackCols.created_at, startISO);
      }
      if (endISO) {
        query = query.lt(feedbackCols.created_at, endISO);
      }
      if (!startISO && !endISO) {
        query = query.limit(50);
      }
      
      const { data: feedbackData } = await query;
      
      if (feedbackData && feedbackData.length > 0) {
        // Calculate overall statistics
        const totalCount = feedbackData.length;
        const avgOverall = feedbackData.reduce((sum, f) => sum + (f.overall_rating || 0), 0) / totalCount;
        const avgHospitality = feedbackData.reduce((sum, f) => sum + (f.hospitality_rating || 0), 0) / totalCount;
        const avgFood = feedbackData.reduce((sum, f) => sum + (f.food_rating || 0), 0) / totalCount;
        const avgDrink = feedbackData.reduce((sum, f) => sum + (f.drink_rating || 0), 0) / totalCount;
        const avgTeam = feedbackData.reduce((sum, f) => sum + (f.team_rating || 0), 0) / totalCount;
        const avgVenue = feedbackData.reduce((sum, f) => sum + (f.venue_rating || 0), 0) / totalCount;
        const avgPrice = feedbackData.reduce((sum, f) => sum + (f.price_rating || 0), 0) / totalCount;
        const anonymousCount = feedbackData.filter(f => f.is_anonymous).length;
        
        // Get recent comments
        const recentComments = feedbackData
          .filter(f => f.message && f.message.trim().length > 0)
          .slice(0, 10)
          .map(f => ({
            message: f.message,
            overall_rating: f.overall_rating,
            date: f.created_at,
          }));
        
        console.log(`✓ Retrieved ${recentComments.length} feedback comments`);
        if (recentComments.length > 0) {
          console.log(`  Most recent: ${recentComments[0].date} - Rating: ${recentComments[0].overall_rating}/5`);
        }
        
        retrieved.feedbackStats = {
          totalSubmissions: totalCount,
          timePeriod: timePeriod || 'all_time',
          averageRatings: {
            overall: Math.round(avgOverall * 10) / 10,
            hospitality: Math.round(avgHospitality * 10) / 10,
            food: Math.round(avgFood * 10) / 10,
            drink: Math.round(avgDrink * 10) / 10,
            team: Math.round(avgTeam * 10) / 10,
            venue: Math.round(avgVenue * 10) / 10,
            price: Math.round(avgPrice * 10) / 10,
          },
          anonymousPercentage: Math.round((anonymousCount / totalCount) * 100),
          recentComments,
        };
        
        console.log(`📊 Retrieved feedback statistics: ${totalCount} submissions for period '${timePeriod || 'all_time'}', avg overall: ${retrieved.feedbackStats.averageRatings.overall}`);
      } else {
        // No feedback in selected period
        retrieved.feedbackStats = {
          totalSubmissions: 0,
          timePeriod: timePeriod || 'all_time',
          averageRatings: {
            overall: 0,
            hospitality: 0,
            food: 0,
            drink: 0,
            team: 0,
            venue: 0,
            price: 0,
          },
          anonymousPercentage: 0,
          recentComments: [],
          message: `No feedback submissions found for the selected time period (${timePeriod || 'all time'}).`
        };
        console.log(`📊 No feedback found for period '${timePeriod || 'all_time'}'`);
      }
    } catch (error) {
      console.error('Error retrieving feedback data:', error);
    }
    
    return retrieved;
  }
  
  // Handle Common Knowledge intents separately (no event needed)
  if (intent.type === 'knowledge' || intent.type === 'policy' || intent.type === 'procedure' || intent.type === 'document') {
    if (intent.searchQuery) {
      console.log('🔐 Using service role client for knowledge base query in retrieveTargetedData');
      const dbClient = serviceRoleClient || supabase;
      const ckData = await retrieveCommonKnowledgeData(supabase, intent.searchQuery, dbClient);
      return { ...retrieved, ...ckData };
    }
    return retrieved;
  }
  
  if (!eventId) {
    return retrieved;
  }
  
  try {
    // Retrieve menu data for menu or BEO intent (people often ask "menu on the BEO")
    if (intent.type === 'menu' || intent.type === 'beo' || intent.type === 'pdf') {
      const { data: menus } = await supabase
        .from('event_menus')
        .select('course, item_name, description, allergens, price, notes')
        .eq('event_id', eventId)
        .order('course')
        .order('item_name');
      
      retrieved.menus = menus || [];
      console.log(`📋 Retrieved ${menus?.length || 0} menu items for event ${eventId}`);
    }
    
    // Retrieve BEO data for beo/pdf intent
    if (intent.type === 'beo' || intent.type === 'pdf') {
      const { data: beos } = await supabase
        .from('event_beo_versions')
        .select('version_no, generated_at, pdf_url, notes, is_final')
        .eq('event_id', eventId)
        .order('generated_at', { ascending: false })
        .limit(1);
      
      if (beos && beos.length > 0 && beos[0].pdf_url) {
        // Derive storage path (supports legacy absolute URLs)
        const raw = beos[0].pdf_url as string;
        const marker = '/beo-documents/';
        let targetFile = raw;
        if (raw.startsWith('http')) {
          const idx = raw.indexOf(marker);
          if (idx !== -1) targetFile = raw.substring(idx + marker.length);
        } else if (raw.startsWith('beo-documents/')) {
          targetFile = raw.substring('beo-documents/'.length);
        }
        
        // Create signed URL (fallback)
        try {
          const { data: signed } = await supabase.storage
            .from('beo-documents')
            .createSignedUrl(targetFile, 60 * 60);
          retrieved.beoSignedUrl = signed?.signedUrl;
        } catch (e) {
          console.warn('Failed to create signed URL directly, will rely on proxy:', e);
        }
        
        // Generate viewer path for first-party inline display
        retrieved.beoViewerPath = `https://www.croftcommontest.com/beo/view?f=${encodeURIComponent(targetFile)}`;
        
        retrieved.latestBeo = beos[0];
        console.log(`📄 Retrieved BEO v${beos[0].version_no} with viewer path`);
      }
    }
    
    // Retrieve schedule data for schedule intent
    if (intent.type === 'schedule') {
      const { data: schedule } = await supabase
        .from('event_schedule')
        .select('time_label, scheduled_at, duration_minutes, responsible_role, notes')
        .eq('event_id', eventId)
        .order('scheduled_at');
      
      retrieved.schedule = schedule || [];
      console.log(`⏰ Retrieved ${schedule?.length || 0} schedule items`);
    }
    
    // Retrieve staffing data for staffing intent
    if (intent.type === 'staffing') {
      const { data: staffing } = await supabase
        .from('event_staffing')
        .select('role, qty, shift_start, shift_end, hourly_rate, notes')
        .eq('event_id', eventId)
        .order('shift_start');
      
      retrieved.staffing = staffing || [];
      console.log(`👥 Retrieved ${staffing?.length || 0} staffing roles`);
    }
    
    // Retrieve equipment data for equipment intent
    if (intent.type === 'equipment') {
      const { data: equipment } = await supabase
        .from('event_equipment')
        .select('category, item_name, quantity, specifications, supplier, hire_cost')
        .eq('event_id', eventId)
        .order('category');
      
      retrieved.equipment = equipment || [];
      console.log(`🔧 Retrieved ${equipment?.length || 0} equipment items`);
    }
    
    // Always get basic event info for context
    const { data: event } = await supabase
      .from('management_events')
      .select('code, event_type, primary_date, status, headcount, client_name, budget')
      .eq('id', eventId)
      .maybeSingle();
    
    if (event) {
      retrieved.event = event;
    }
    
  } catch (error) {
    console.error('Error retrieving targeted data:', error);
  }
  
  // Always retrieve financial data for event queries
  if (eventId) {
    try {
      const financials = await calculateEventRevenue(supabase, eventId);
      retrieved.financials = financials;
    } catch (error) {
      console.error('Error calculating event revenue:', error);
    }
  }
  
  return retrieved;
}

// Calculate event revenue from line items with proper gross/service charge handling
async function calculateEventRevenue(supabase: any, eventId: string) {
  try {
    console.log(`💰 Calculating revenue for event ${eventId}`);
    
    // Get all line items for the event (these are GROSS prices)
    const { data: lineItems, error: lineError } = await supabase
      .from('management_event_line_items')
      .select('description, unit_price, qty')
      .eq('event_id', eventId);
    
    if (lineError) {
      console.error('Error fetching line items:', lineError);
      return null;
    }
    
    // Get service charge percentage from the event
    const { data: event, error: eventError } = await supabase
      .from('management_events')
      .select('service_charge_pct')
      .eq('id', eventId)
      .maybeSingle();
    
    if (eventError) {
      console.error('Error fetching event:', eventError);
      return null;
    }
    
    const serviceChargePct = event?.service_charge_pct || 0;
    
    // Calculate gross subtotal (sum of all line items)
    const grossSubtotal = lineItems?.reduce((sum, item) => {
      const itemTotal = (item.unit_price || 0) * (item.qty || 1);
      return sum + itemTotal;
    }, 0) || 0;
    
    // Service charge is applied to the gross subtotal
    const serviceChargeAmount = (grossSubtotal * serviceChargePct) / 100;
    
    // Total is gross subtotal + service charge
    const totalGross = grossSubtotal + serviceChargeAmount;
    
    // Extract VAT for display purposes (VAT is 20%, embedded in gross prices)
    const vatAmount = (totalGross / 1.20) * 0.20;
    
    console.log(`💰 Revenue calculated: Gross Subtotal £${grossSubtotal.toFixed(2)}, Service Charge (${serviceChargePct}%) £${serviceChargeAmount.toFixed(2)}, Total £${totalGross.toFixed(2)}`);
    
    return {
      grossSubtotal: Number(grossSubtotal.toFixed(2)),
      serviceChargePct,
      serviceChargeAmount: Number(serviceChargeAmount.toFixed(2)),
      totalGross: Number(totalGross.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      lineItems: lineItems || [],
      itemCount: lineItems?.length || 0,
      source: 'management_event_line_items'
    };
  } catch (error) {
    console.error('Error in calculateEventRevenue:', error);
    return null;
  }
}

async function fetchMinimalBaseData(supabase: any, userRole: string) {
  try {
    // Only fetch high-level overviews for context
    const { data: events } = await supabase
      .from('management_events')
      .select('id, code, event_type, primary_date, status, headcount, client_name')
      .order('primary_date', { ascending: true })
      .limit(20);
    
    const { data: spaces } = await supabase
      .from('spaces')
      .select('id, name, capacity_seated, capacity_standing')
      .eq('is_active', true)
      .order('display_order')
      .limit(10);
    
    return {
      events: events || [],
      spaces: spaces || [],
      eventCount: events?.length || 0,
      spaceCount: spaces?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching minimal base data:', error);
    return { events: [], spaces: [], eventCount: 0, spaceCount: 0 };
  }
}

// ============= END INTENT & RESOLUTION =============

// Define function schema for AI agent
const FUNCTION_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_management_data",
      description: "Retrieve any management data including events, bookings, menus, schedules, staffing, equipment, or feedback. This function provides comprehensive access to all operational data.",
      parameters: {
        type: "object",
        properties: {
          data_type: {
            type: "string",
            enum: ["event", "booking", "menu", "schedule", "staffing", "equipment", "feedback", "beo", "contract"],
            description: "Type of data to retrieve"
          },
          event_identifier: {
            type: "string",
            description: "Event code (e.g., 'WED001') or date (e.g., '2024-03-15') to identify the event"
          },
          filters: {
            type: "object",
            description: "Optional filters like date_range, status, venue_id, etc.",
            properties: {
              date_range: { type: "object" },
              status: { type: "string" },
              venue_id: { type: "string" }
            }
          },
          include_related: {
            type: "boolean",
            description: "Whether to include related data (e.g., menu with event details)",
            default: false
          }
        },
        required: ["data_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the Common Knowledge database for policies, procedures, venue information, and operational guidelines.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (e.g., 'fire safety', 'dietary requirements', 'venue capacity')"
          },
          document_type: {
            type: "string",
            enum: ["policy", "procedure", "venue_info", "all"],
            description: "Type of document to search",
            default: "all"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_analytics",
      description: "Get analytics, insights, and trends for feedback, revenue, capacity, or other operational metrics.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["feedback", "revenue", "capacity", "trends", "conflicts"],
            description: "Type of analytics to retrieve"
          },
          event_identifier: {
            type: "string",
            description: "Event code (e.g. '2025002') or a natural date like '7th October' - required for revenue queries"
          },
          time_period: {
            type: "string",
          enum: ["today", "yesterday", "week", "month", "quarter", "year", "all_time"],
            description: "Time period for analytics",
            default: "month"
          },
          filters: {
            type: "object",
            description: "Additional filters like event_id, venue_id, etc."
          }
        },
        required: ["type"]
      }
    }
  }
];

// Function execution handler
async function executeFunction(functionName: string, args: any, supabase: any, userRole: string, serviceRoleClient?: any) {
  console.log(`🔧 Executing function: ${functionName}`, JSON.stringify(args).substring(0, 200));
  
  try {
    switch (functionName) {
      case "get_management_data": {
        const { data_type, event_identifier, filters, include_related, time_period } = args;
        
        // Use existing intent detection and data retrieval logic
        const intent = {
          type: data_type === 'menu' ? 'menu' : 
                data_type === 'beo' ? 'beo' :
                data_type === 'schedule' ? 'schedule' :
                data_type === 'staffing' ? 'staffing' :
                data_type === 'equipment' ? 'equipment' :
                data_type === 'feedback' ? 'feedback' :
                'event',
          eventIdentifier: event_identifier || null
        };
        
        // Resolve event if identifier provided
        let resolvedEventId = null;
        if (event_identifier) {
          resolvedEventId = await resolveEvent(supabase, event_identifier);
        }
        
        // Retrieve targeted data (pass time_period and filters)
        const data = await retrieveTargetedData(supabase, intent, resolvedEventId, time_period, filters?.date_range, filters, serviceRoleClient);
        
        return {
          success: true,
          data_type,
          event_id: resolvedEventId,
          data,
          related_data_available: include_related ? ["menu", "beo", "schedule", "staffing"] : [],
          metadata: {
            timestamp: new Date().toISOString(),
            data_freshness: "real-time"
          }
        };
      }
      
      case "search_knowledge_base": {
        const { query, document_type, limit } = args;
        const data = await retrieveCommonKnowledgeData(supabase, query, serviceRoleClient);
        
        return {
          success: true,
          query,
          document_type: document_type || "all",
          results: (data.documents || []).slice(0, limit || 5),
          total_found: data.totalDocs || (data.documents?.length || 0),
          documents: data.documents || [],
          collections: data.collections || [],
          metadata: {
            search_quality: "high",
            timestamp: new Date().toISOString()
          }
        };
      }
      
      case "get_analytics": {
        const { type, time_period, filters } = args;
        
        // Tolerant event identifier extraction - check multiple locations
        const eventIdent = args.event_identifier ?? filters?.event_identifier ?? filters?.event_id;
        
        // Handle revenue/financial queries
        if (type === 'revenue' || type === 'financial' || type === 'budget') {
          let resolvedEventId = null;
          if (eventIdent) {
            resolvedEventId = await resolveEvent(supabase, eventIdent);
          }
          
          if (!resolvedEventId) {
            return {
              success: false,
              error: "Event identifier required for revenue queries. Please specify an event code or date."
            };
          }
          
          const financials = await calculateEventRevenue(supabase, resolvedEventId);
          
          return {
            success: true,
            analytics_type: 'revenue',
            event_id: resolvedEventId,
            data: { financials },
            metadata: {
              calculated_at: new Date().toISOString(),
              confidence: "high",
              data_freshness: "real-time"
            }
          };
        }
        
        // Map analytics type to intent
        const intent = {
          type: type === 'feedback' ? 'feedback' :
                type === 'conflicts' ? 'schedule' :
                type,
          eventIdentifier: eventIdent || null
        };
        
        // Resolve event if identifier provided
        let resolvedEventId = null;
        if (eventIdent) {
          resolvedEventId = await resolveEvent(supabase, eventIdent);
        }
        
        // Use existing comprehensive data retrieval logic with time period
        const data = await retrieveTargetedData(supabase, intent, resolvedEventId, time_period, filters?.date_range, filters, serviceRoleClient);
        
        // For conflicts, get additional conflict data
        if (type === 'conflicts') {
          const { data: conflictData } = await supabase
            .from('conflicts')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
            
          return {
            success: true,
            analytics_type: type,
            time_period: time_period || "month",
            data: {
              ...data,
              active_conflicts: conflictData?.length || 0,
              conflicts: conflictData || [],
              severity_breakdown: conflictData?.reduce((acc: any, c: any) => {
                acc[c.severity] = (acc[c.severity] || 0) + 1;
                return acc;
              }, {})
            },
            metadata: {
              calculated_at: new Date().toISOString(),
              confidence: "high",
              data_freshness: "real-time"
            }
          };
        }
        
        return {
          success: true,
          analytics_type: type,
          time_period: time_period || "month",
          data,
          metadata: {
            calculated_at: new Date().toISOString(),
            confidence: "high",
            data_freshness: "real-time"
          }
        };
      }
      
      default:
        return {
          success: false,
          error: `Unknown function: ${functionName}`
        };
    }
  } catch (error) {
    console.error(`❌ Function execution error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Function execution failed"
    };
  }
}

// Natural language time phrase mapper for analytics/feedback
function mapTimePhraseToPeriod(text: string): 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'all_time' {
  const t = (text || '').toLowerCase();
  if (/\btoday\b/.test(t)) return 'today';
  if (/\byesterday\b/.test(t)) return 'yesterday';
  if (/(this|current)\s+week/.test(t)) return 'week';
  if (/last\s+week/.test(t)) return 'week';
  if (/(this|current)\s+month/.test(t)) return 'month';
  if (/last\s+month/.test(t)) return 'month';
  if (/quarter|q\d/.test(t)) return 'quarter';
  if (/year|12\s*months/.test(t)) return 'year';
  if (/all\s*time|ever|since\s+launch/.test(t)) return 'all_time';
  return 'month';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📥 Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { messages, context } = requestBody;
    
    // Defensive checks for messages
    if (!messages) {
      console.error('❌ No messages provided in request body');
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!Array.isArray(messages)) {
      console.error('❌ Messages is not an array:', typeof messages);
      return new Response(JSON.stringify({ error: 'Messages must be an array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (messages.length === 0) {
      console.error('❌ Messages array is empty');
      return new Response(JSON.stringify({ error: 'Messages array cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Verify user authentication and role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token for role verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user has management role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check management role
    const { data: roleData } = await supabaseClient
      .rpc('get_user_management_role', { _user_id: user.id });
    
    if (!roleData) {
      console.error('No management role for user:', user.id);
      return new Response(JSON.stringify({ error: 'Unauthorized - no management role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Authenticated user:', user.email, 'Role:', roleData);

    // Create service role client for knowledge base queries (only if key is set)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let serviceRoleClient: any | undefined = undefined;
    if (serviceRoleKey && serviceRoleKey.trim().length > 0) {
      serviceRoleClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey,
        { global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } } }
      );
      console.log('🔐 Using service role client for knowledge base queries');
    } else {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set; falling back to RLS-scoped client for knowledge queries');
    }

    // Use supabaseClient for regular operations (respects RLS)
    const supabase = supabaseClient;

    console.log('🎯 Processing message with function calling enabled');
    console.log('📚 Conversation history length:', messages.length);

    // Fetch minimal base data for context (overview only)
    const baseData = await fetchMinimalBaseData(supabase, context?.user?.role);

    // Build minimal system prompt - no pre-fetching data
    const systemPrompt = buildSystemPrompt(context, baseData, null);

    // First AI request with function calling enabled
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: FUNCTION_TOOLS,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle streaming response with function call detection
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    if (!reader) {
      throw new Error("No response body");
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          let functionCallDetected = false;
          let accumulatedFunctionCall: any = null;

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // If we detected a function call, execute it and get final response
              if (functionCallDetected && accumulatedFunctionCall) {
                console.log('🎯 Function call detected, executing...');

                // Parse tool arguments safely before execution (critical)
                let fnArgs: any = accumulatedFunctionCall.arguments;
                if (typeof fnArgs === 'string') {
                  try {
                    fnArgs = JSON.parse(fnArgs);
                  } catch (e) {
                    console.error('Failed to parse function arguments before execution:', e);
                  }
                }

                // Auto-infer event_identifier for revenue queries if missing
                if (accumulatedFunctionCall.name === 'get_analytics' && fnArgs) {
                  const isRevenueQuery = fnArgs.type === 'revenue' || fnArgs.type === 'financial' || fnArgs.type === 'budget';
                  
                  if (isRevenueQuery && !fnArgs.event_identifier) {
                    // First, try to copy from filters
                    if (fnArgs.filters?.event_identifier) {
                      fnArgs.event_identifier = fnArgs.filters.event_identifier;
                      console.log('📋 Copied event_identifier from filters:', fnArgs.event_identifier);
                    } else if (fnArgs.filters?.event_id) {
                      fnArgs.event_identifier = fnArgs.filters.event_id;
                      console.log('📋 Copied event_id from filters as event_identifier:', fnArgs.event_identifier);
                    } else {
                      // Try to infer from user's message
                      const lastUserMsg = messages.slice().reverse().find((m: any) => m.role === 'user');
                      if (lastUserMsg?.content) {
                        const inferred = extractEventIdentifier(lastUserMsg.content, messages);
                        if (inferred) {
                          fnArgs.event_identifier = inferred;
                          console.log('🔍 Inferred event_identifier from user message:', inferred);
                        }
                      }
                    }
                  }
                }

                const functionResult = await executeFunction(
                  accumulatedFunctionCall.name,
                  fnArgs,
                  supabase,
                  context?.user?.role,
                  serviceRoleClient
                );

                console.log('✅ Function result:', JSON.stringify(functionResult).substring(0, 200));

                // Make second AI request with function result
                const toolCallId = 'call_' + Date.now();
                const finalMessages = [
                  ...messages,
                  {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                      id: toolCallId,
                      type: 'function',
                      function: {
                        name: accumulatedFunctionCall.name,
                        arguments: JSON.stringify(fnArgs)
                      }
                    }]
                  },
                  {
                    role: 'tool',
                    tool_call_id: toolCallId,
                    content: JSON.stringify(functionResult)
                  }
                ];

                console.log('🔁 Requesting final model answer with tool result...');
                const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      { role: 'system', content: systemPrompt },
                      ...finalMessages,
                    ],
                    tools: FUNCTION_TOOLS,
                    stream: true,
                  }),
                });

                // Stream the final response
                const finalReader = finalResponse.body?.getReader();
                if (finalReader) {
                  while (true) {
                    const { done: finalDone, value: finalValue } = await finalReader.read();
                    if (finalDone) break;
                    controller.enqueue(finalValue);
                  }
                }
              } else {
                // No function call detected — enforce tool-first fallback for feedback/reviews
                const lastUserMessage = messages?.slice().reverse().find((m: any) => m.role === 'user')?.content || '';
                const inferred = detectIntent(lastUserMessage, messages);
                if (inferred.type === 'feedback' || inferred.type === 'reviews') {
                  const period = mapTimePhraseToPeriod(lastUserMessage);
                  console.log(`🔁 Fallback: forcing get_analytics(type=feedback, time_period=${period})`);
                  const functionResult = await executeFunction(
                    'get_analytics',
                    { type: 'feedback', time_period: period },
                    supabase,
                    context?.user?.role,
                    serviceRoleClient
                  );
                  const toolCallId = 'call_' + Date.now();
                  const finalMessages = [
                    ...messages,
                    {
                      role: 'assistant',
                      content: null,
                      tool_calls: [{
                        id: toolCallId,
                        type: 'function',
                        function: { name: 'get_analytics', arguments: JSON.stringify({ type: 'feedback', time_period: period }) }
                      }]
                    },
                    { role: 'tool', tool_call_id: toolCallId, content: JSON.stringify(functionResult) }
                  ];
                  const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      model: 'google/gemini-2.5-flash',
                      messages: [ { role: 'system', content: systemPrompt }, ...finalMessages ],
                      tools: FUNCTION_TOOLS,
                      stream: true,
                    }),
                  });
                  const finalReader = finalResponse.body?.getReader();
                  if (finalReader) {
                    while (true) {
                      const { done: finalDone, value: finalValue } = await finalReader.read();
                      if (finalDone) break;
                      controller.enqueue(finalValue);
                    }
                  }
                }
              }
              
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  // Check for function call
                  if (parsed.choices?.[0]?.delta?.tool_calls) {
                    functionCallDetected = true;
                    const toolCall = parsed.choices[0].delta.tool_calls[0];
                    
                    if (!accumulatedFunctionCall) {
                      accumulatedFunctionCall = {
                        name: toolCall.function?.name || '',
                        arguments: ''
                      };
                    }
                    
                    if (toolCall.function?.arguments) {
                      accumulatedFunctionCall.arguments += toolCall.function.arguments;
                    }
                    
                    // Don't send function call chunks to client
                    continue;
                  }
                  
                  // Normal content - pass through if no function call detected
                  if (!functionCallDetected) {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  // Invalid JSON, skip
                  console.warn('Failed to parse SSE data:', e);
                }
              }
            }
          }
          
          // Try to parse accumulated function arguments
          if (accumulatedFunctionCall && accumulatedFunctionCall.arguments) {
            try {
              accumulatedFunctionCall.arguments = JSON.parse(accumulatedFunctionCall.arguments);
            } catch (e) {
              console.error('Failed to parse function arguments:', e);
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Management AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Old fetchRealData function removed - replaced with fetchMinimalBaseData and retrieveTargetedData

/**
 * Parse contract content to extract financial data
 */
function parseContractFinancials(contractContent: string): any {
  if (!contractContent) return null;

  try {
    const text = contractContent.replace(/\r/g, '');
    const financials: any = {
      lineItems: [],
      subtotal: 0,
      vatRate: 0,
      vatAmount: 0,
      serviceChargeRate: 0,
      serviceChargeAmount: 0,
      total: 0
    };

    // Patterns for line items (handle both "qty × £unit" and "£unit × qty", allow x or ×, optional "people", optional bullets)
    const itemPatterns = [
      /^\s*[•\-\u2022]?\s*(.+?)\s*-\s*(\d+)\s*(?:people\s*)?[x×]\s*£([\d,]+\.?\d*)\s*=\s*£([\d,]+\.?\d*)/gim,
      /^\s*[•\-\u2022]?\s*(.+?)\s*-\s*£([\d,]+\.?\d*)\s*[x×]\s*(\d+)\s*=\s*£([\d,]+\.?\d*)/gim,
    ];

    for (const pattern of itemPatterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        // Normalise capture groups to: description, unitPrice, qty, total
        let description = (m[1] || '').trim();
        let unitPrice: string, qty: string, total: string;
        if (pattern === itemPatterns[0]) {
          qty = m[2];
          unitPrice = m[3];
          total = m[4];
        } else {
          unitPrice = m[2];
          qty = m[3];
          total = m[4];
        }
        financials.lineItems.push({
          description,
          unitPrice: parseFloat(unitPrice.replace(/,/g, '')),
          qty: parseInt(qty),
          total: parseFloat(total.replace(/,/g, '')),
        });
      }
    }

    // Financial summary with robust variants
    const subtotalMatch = text.match(/Subtotal(?:\s*\([^)]+\))?\s*:\s*£([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      financials.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
    }

    const vatMatch = text.match(/VAT\s*\((\d+)%\)\s*:\s*£([\d,]+\.?\d*)/i);
    if (vatMatch) {
      financials.vatRate = parseFloat(vatMatch[1]);
      financials.vatAmount = parseFloat(vatMatch[2].replace(/,/g, ''));
    }

    const serviceMatch = text.match(/Service\s*Charge\s*\((\d+)%\)\s*:\s*£([\d,]+\.?\d*)/i);
    if (serviceMatch) {
      financials.serviceChargeRate = parseFloat(serviceMatch[1]);
      financials.serviceChargeAmount = parseFloat(serviceMatch[2].replace(/,/g, ''));
    }

    const totalMatch = text.match(/(TOTAL AMOUNT DUE|Total Amount Due|Total due|Total Due|Total)\s*:\s*£([\d,]+\.?\d*)/i);
    if (totalMatch) {
      financials.total = parseFloat(totalMatch[2].replace(/,/g, ''));
    }

    // Derive missing pieces if possible
    if (financials.subtotal === 0 && financials.lineItems.length > 0) {
      financials.subtotal = financials.lineItems.reduce((s: number, it: any) => s + (it.total || ((it.unitPrice || 0) * (it.qty || 1))), 0);
    }
    if (financials.total === 0 && financials.subtotal > 0) {
      financials.total = financials.subtotal + (financials.vatAmount || 0) + (financials.serviceChargeAmount || 0);
    }

    if (financials.lineItems.length > 0 || financials.total > 0) {
      console.log(`✓ Contract financials parsed: ${financials.lineItems.length} items, total £${financials.total.toFixed(2)}`);
      return financials;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse contract financials:', error);
    return null;
  }
}

function buildSystemPrompt(context: any, baseData: any, retrievedData: any): string {
  const { user, page, currentDate } = context;
  
  // Build minimal base prompt with function calling instructions
  let prompt = `You're Cleo, Croft Common's AI assistant - here to help the management team work smarter and faster.

**CRITICAL RULES:**
- You have access to FUNCTION TOOLS to retrieve real-time data - USE THEM!
- ALWAYS call functions to get current data rather than relying on static overviews
- ONLY use data from function results or the DATABASE OVERVIEW as fallback
- NEVER make up, invent, or hallucinate information
- If you need data, call the appropriate function first
- Use British English (organised, colour, etc.) and always use £ (never $)
- For feedback/reviews questions do NOT ask for an event ID unless the user explicitly mentions an event; default to organisation-wide stats for a sensible time period
- For feedback/reviews, call get_analytics with type="feedback" and infer time_period from the user’s wording (e.g. “today”, “this week”)
- Never mention or refer to membership tiers
- All links must use https://www.croftcommontest.com
- Use proper line breaks for readability - add blank lines between sections

**FINANCIAL DATA (Revenue, Budget, Pricing):**
- All prices in the system are GROSS (VAT-inclusive)
- Service charge is calculated on the gross subtotal (NOT on net)
- Financial data comes from management_event_line_items table
- When asked about revenue/costs/pricing/budget:
  1. State the gross subtotal (sum of line items)
  2. State the service charge percentage and amount
  3. State the total (subtotal + service charge)
  4. You can mention approximate VAT for reference (total / 1.20 * 0.20)
  5. Always mention the source is from BEO line items
  6. Offer to show the BEO viewer link for full details
- Example: "The revenue for event 2025002 is £971.30 (£883 gross subtotal + £88.30 service charge at 10%). This includes VAT of approximately £161.88. Would you like to see the full BEO?"

**TERMINOLOGY - CRITICAL:**
- ALWAYS use "folder" or "folders" when referring to document collections
- NEVER EVER use "collection" or "collections" in your responses to users
- When citing documents, ALWAYS mention which folder they're in: "In the [Folder Name] folder, the [Document Title] shows..."
- Example: User says "What's in the Marketing folder?" → You say "In the Marketing folder, there are X documents including..."
- Example: User asks "strategic marketing plan" → You say "In the Marketing folder, the Strategic Marketing Plan document states..."
- Example: User asks "Do we have folders for contracts?" → You say "Yes, we have folders organised by..."
- NEVER correct users or explain database structure - just use "folder" naturally in all responses
- When you get search results, cite the folder location prominently to help users find documents

**YOUR FUNCTION TOOLS (Use these proactively!):**

1. **get_management_data** - For ANY specific data requests:
   - Event details, bookings, menus, schedules, staffing, equipment, feedback, BEOs, contracts
   - Example: User asks "What's the menu for WED001?" → Call get_management_data with data_type="menu", event_identifier="WED001"
   - Example: "Show me upcoming events" → Call get_management_data with data_type="event"
   - Example: "What feedback did we get?" → Call get_management_data with data_type="feedback"

2. **search_knowledge_base** - For policies, procedures, documents in folders:
   - Search is VERY INTELLIGENT and finds documents even with broad queries
   - Handles partial matches, synonyms, and semantic similarity automatically
   - You DON'T need exact folder names or document titles - search confidently!
   - Search understands context: "marketing document" WILL find "Strategic Marketing Plan"
   - ALWAYS mention the folder location when citing documents in your response
   - Example: "What's our fire safety policy?" → Call search_knowledge_base("fire safety policy") → Cite: "In the [Folder] folder, the Fire Safety Policy states..."
   - Example: "strategic marketing document" → Call search_knowledge_base("strategic marketing") → Cite: "In the Marketing folder, the Strategic Marketing Plan outlines..."
   - Example: "dietary requirements" → Call search_knowledge_base("dietary requirements") → Cite results with folder context
   - Example: "what's in the marketing folder?" → Call search_knowledge_base("marketing") → List documents with their folder
   - TIP: Use natural, descriptive queries - the search is smart and WILL find relevant documents

3. **get_analytics** - For insights, trends, analytics, and financial data:
   - Example: "How's our feedback trending?" → Call get_analytics with type="feedback"
   - Example: "Any booking conflicts?" → Call get_analytics with type="conflicts"
   - Example: "Show me capacity trends" → Call get_analytics with type="capacity"
   - Example: "What's the revenue for event X?" → Call get_analytics with type="revenue", event_identifier="X"
   - Example: "What's the budget for 7th October?" → Call get_analytics with type="revenue", event_identifier="7th October"

**WHEN TO CALL FUNCTIONS:**
- User asks about specific events/bookings → get_management_data
- User asks "what's the..." or "show me..." → get_management_data
- User mentions event codes or dates → get_management_data with event_identifier
- User asks "how do we..." or "what's our policy..." → search_knowledge_base
- User asks about trends, stats, analytics → get_analytics
- User asks about feedback or ratings → get_analytics with type="feedback"
- User asks about revenue, costs, budget, pricing → get_analytics with type="revenue" and event_identifier

**Your Personality:**
- Your name is Cleo
- Be warm, friendly, and conversational (like a helpful colleague)
- Be efficient - get to the point without being robotic
- Use contractions (there's, you've, let's) and natural language
- Address ${user?.firstName || 'the user'} by first name when possible

**Current Context:**
- User: ${user?.firstName || ''} ${user?.lastName || ''} (${user?.role})
- Page: ${page?.route || 'Dashboard'}
- Today: ${currentDate || new Date().toISOString()}

**Permissions:**
${getRolePermissions(user?.role)}

**DATABASE OVERVIEW (High-level context - prefer calling functions for specific data):**
- Events: ${baseData.eventCount} upcoming events
${baseData.events?.slice(0, 5).map((e: any) => 
  `  • ${e.code}: ${e.event_type} on ${e.primary_date} (${e.status})`
).join('\n') || '  No events'}

- Spaces: ${baseData.spaceCount} active spaces
${baseData.spaces?.map((s: any) => 
  `  • ${s.name}: Seated ${s.capacity_seated}, Standing ${s.capacity_standing}`
).join('\n') || '  No spaces'}
`;

  // Add RETRIEVED DATA section if we have targeted data (from function calls)
  if (retrievedData && Object.keys(retrievedData).length > 1) {
    prompt += `\n**━━━ RETRIEVED DATA (From function call results) ━━━**\n`;
    
    // Common Knowledge data
    if (retrievedData.documents && retrievedData.documents.length > 0) {
      prompt += `\n📚 COMMON KNOWLEDGE DOCUMENTS (${retrievedData.totalDocs} found):\n`;
      if (retrievedData.searchMethod) prompt += `Search method: ${retrievedData.searchMethod}\n`;
      if (retrievedData.folderContext) prompt += `Folder context: ${retrievedData.folderContext}\n`;
      
      retrievedData.documents.forEach((doc: any, idx: number) => {
        prompt += `\n${idx + 1}. ${doc.title} [${doc.type}]`;
        if (doc.collection) prompt += ` | Folder: ${doc.collection}`;
        if (doc.matchReason) prompt += ` | Match: ${doc.matchReason}`;
        if (doc.score) prompt += ` (score: ${doc.score})`;
        prompt += `\n   Link: https://www.croftcommontest.com/management/common-knowledge/d/${doc.slug}`;
        if (doc.description) prompt += `\n   Description: ${doc.description}`;
        if (doc.tags && doc.tags.length > 0) prompt += `\n   Tags: ${doc.tags.join(', ')}`;
        if (doc.zones && doc.zones.length > 0) prompt += `\n   Zones: ${doc.zones.join(', ')}`;
        if (doc.summary) prompt += `\n   Summary: ${doc.summary}`;
        if (doc.content) {
          prompt += `\n   Content Preview: ${doc.content.substring(0, 300)}${doc.content.length > 300 ? '...' : ''}`;
        }
        prompt += '\n';
      });

      // Provide full content for the primary document to ensure complete answers
      const primary = retrievedData.documents[0];
      if (primary?.content_full) {
        const FULL_LIMIT = 80000; // guard against overly long prompts
        const fullContent = primary.content_full.length > FULL_LIMIT
          ? primary.content_full.substring(0, FULL_LIMIT)
          : primary.content_full;
        prompt += `\n🔎 Full Content — ${primary.title}:\n${fullContent}\n`;
      }
      if (retrievedData.collections && retrievedData.collections.length > 0) {
        prompt += `\nAvailable Folders (always use this terminology with users):\n`;
        retrievedData.collections.slice(0, 10).forEach((col: any) => {
          prompt += `  • ${col.name}\n`;
        });
      }
      prompt += `\nIMPORTANT: When citing documents, always mention their "Folder" location to help users find them.\n`;
    }
    
    // Event context
    if (retrievedData.event) {
      const e = retrievedData.event;
      prompt += `\nEVENT: ${e.event_type} (Code: ${e.code})
Date: ${e.primary_date}
Status: ${e.status}
Client: ${e.client_name || 'N/A'}
Attendees: ${e.headcount || 'TBC'}${e.budget ? `\nBudget: £${e.budget}` : ''}\n`;
    }
    
    // Menu data
    if (retrievedData.menus && retrievedData.menus.length > 0) {
      prompt += `\n🍽️ MENU ITEMS (${retrievedData.menus.length} dishes):\n`;
      
      // Group by course
      const courses: Record<string, any[]> = {};
      retrievedData.menus.forEach((m: any) => {
        if (!courses[m.course]) courses[m.course] = [];
        courses[m.course].push(m);
      });
      
      Object.entries(courses).forEach(([course, items]) => {
        prompt += `\n${course}:\n`;
        items.forEach((m: any) => {
          prompt += `  • ${m.item_name}`;
          if (m.description) prompt += ` - ${m.description}`;
          if (m.price) prompt += ` [£${m.price}]`;
          if (m.allergens && m.allergens.length > 0) {
            prompt += `\n    ⚠️ Allergens: ${m.allergens.join(', ')}`;
          }
          prompt += '\n';
        });
      });
    } else if (retrievedData.event) {
      // Be explicit to avoid hallucinating from financials
      prompt += `\n🍽️ MENU ITEMS: None found for this event in the database.\n`;
    }
    
    // Financial data
    if (retrievedData.financials) {
      const fin = retrievedData.financials;
      prompt += `\n💰 FINANCIAL DATA:\n`;
      prompt += `  Gross Subtotal: £${fin.grossSubtotal} (from ${fin.itemCount} line items)\n`;
      prompt += `  Service Charge: ${fin.serviceChargePct}% = £${fin.serviceChargeAmount}\n`;
      prompt += `  Total (Gross): £${fin.totalGross}\n`;
      prompt += `  VAT (approx): £${fin.vatAmount}\n`;
      prompt += `  Source: ${fin.source}\n`;
      if (fin.lineItems && fin.lineItems.length > 0) {
        prompt += `\n  Line Items:\n`;
        fin.lineItems.slice(0, 10).forEach((item: any) => {
          prompt += `    • ${item.description}: £${item.price} × ${item.quantity} = £${(item.price * item.quantity).toFixed(2)}\n`;
        });
        if (fin.lineItems.length > 10) {
          prompt += `    ... and ${fin.lineItems.length - 10} more items\n`;
        }
      }
    }
    
    // BEO data
    if (retrievedData.latestBeo) {
      const beo = retrievedData.latestBeo;
      prompt += `\n📋 BEO (Banquet Event Order):\n`;
      prompt += `  Version: ${beo.version_no}${beo.is_final ? ' (FINAL)' : ' (DRAFT)'}\n`;
      prompt += `  Generated: ${new Date(beo.generated_at).toLocaleString('en-GB')}\n`;
      if (retrievedData.beoViewerPath) {
        prompt += `  📄 View PDF: ${retrievedData.beoViewerPath}\n`;
      }
      if (beo.notes) {
        prompt += `  Notes: ${beo.notes}\n`;
      }
    }
    
    // Schedule data
    if (retrievedData.schedule && retrievedData.schedule.length > 0) {
      prompt += `\n⏰ SCHEDULE (${retrievedData.schedule.length} items):\n`;
      retrievedData.schedule.forEach((s: any) => {
        const time = new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        prompt += `  • ${time} - ${s.time_label}`;
        if (s.duration_minutes) prompt += ` (${s.duration_minutes} min)`;
        if (s.responsible_role) prompt += ` | ${s.responsible_role}`;
        if (s.notes) prompt += `\n    Notes: ${s.notes}`;
        prompt += '\n';
      });
    }
    
    // Staffing data
    if (retrievedData.staffing && retrievedData.staffing.length > 0) {
      prompt += `\n👥 STAFFING (${retrievedData.staffing.length} roles):\n`;
      retrievedData.staffing.forEach((s: any) => {
        prompt += `  • ${s.role} x${s.qty}`;
        if (s.shift_start && s.shift_end) {
          const start = new Date(s.shift_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const end = new Date(s.shift_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          prompt += ` | ${start}-${end}`;
        }
        if (s.hourly_rate) prompt += ` | £${s.hourly_rate}/hr`;
        if (s.notes) prompt += `\n    Notes: ${s.notes}`;
        prompt += '\n';
      });
    }
    
    // Equipment data
    if (retrievedData.equipment && retrievedData.equipment.length > 0) {
      prompt += `\n🔧 EQUIPMENT (${retrievedData.equipment.length} items):\n`;
      retrievedData.equipment.forEach((eq: any) => {
        prompt += `  • ${eq.category}: ${eq.item_name} x${eq.quantity}`;
        if (eq.hire_cost) prompt += ` - £${eq.hire_cost}`;
        if (eq.supplier) prompt += ` (${eq.supplier})`;
        prompt += '\n';
      });
    }
    
    // Feedback data
    if (retrievedData.feedbackStats) {
      const stats = retrievedData.feedbackStats;
      prompt += `\n💬 FEEDBACK STATISTICS:\n`;
      prompt += `  Total Submissions: ${stats.totalSubmissions}\n`;
      prompt += `  Average Rating: ${stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A'}/5.0\n`;
      
      if (stats.ratingDistribution) {
        prompt += `  Rating Distribution:\n`;
        Object.entries(stats.ratingDistribution)
          .sort(([a], [b]) => Number(b) - Number(a))
          .forEach(([rating, count]) => {
            prompt += `    ${'⭐'.repeat(Number(rating))}: ${count} (${((Number(count) / stats.totalSubmissions) * 100).toFixed(0)}%)\n`;
          });
      }
      
      if (stats.sentimentBreakdown) {
        prompt += `  Sentiment Breakdown:\n`;
        Object.entries(stats.sentimentBreakdown).forEach(([sentiment, count]) => {
          const emoji = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐';
          prompt += `    ${emoji} ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}: ${count} (${((Number(count) / stats.totalSubmissions) * 100).toFixed(0)}%)\n`;
        });
      }
      
      if (stats.recentFeedback && stats.recentFeedback.length > 0) {
        prompt += `\n  Recent Feedback (${stats.recentFeedback.length} most recent):\n`;
        stats.recentFeedback.forEach((fb: any, idx: number) => {
          prompt += `\n  ${idx + 1}. Rating: ${fb.overall_rating}/5`;
          if (fb.event_code) prompt += ` | Event: ${fb.event_code}`;
          if (fb.submitted_at) prompt += ` | ${new Date(fb.submitted_at).toLocaleDateString('en-GB')}`;
          if (fb.sentiment) prompt += ` | Sentiment: ${fb.sentiment}`;
          if (fb.food_quality) prompt += `\n     Food: ${fb.food_quality}/5`;
          if (fb.service_quality) prompt += ` | Service: ${fb.service_quality}/5`;
          if (fb.venue_atmosphere) prompt += ` | Venue: ${fb.venue_atmosphere}/5`;
          if (fb.value_for_money) prompt += ` | Value: ${fb.value_for_money}/5`;
          if (fb.comments) prompt += `\n     "${fb.comments.substring(0, 200)}${fb.comments.length > 200 ? '...' : ''}"`;
          if (fb.highlights && fb.highlights.length > 0) prompt += `\n     Highlights: ${fb.highlights.join(', ')}`;
          if (fb.improvements && fb.improvements.length > 0) prompt += `\n     Improvements: ${fb.improvements.join(', ')}`;
          prompt += '\n';
        });
      }
    }
    
    prompt += `\n**━━━ END RETRIEVED DATA ━━━**\n`;
  }


  // Add response guidelines
  prompt += `
**How to Respond:**

FOR QUESTIONS (Most common):
- Chat naturally like a helpful colleague
- Keep it brief but friendly  
- Lead with the answer, not preamble

FOR MENU QUESTIONS:
- If menu data is in RETRIEVED DATA section, list the actual dishes by course
- Include allergens and descriptions when relevant
- Example: "The menu includes: Starters - Charred Octopus, Wood-Roast Aubergine; Mains - Roast Cod; Desserts - Churros"

FOR BEO/PDF REQUESTS:
- If BEO data is in RETRIEVED DATA, output the viewer URL (beoViewerPath) for viewing
- Make it clear and clickable by including the full https:// URL
- Provide version number and generation date
- Example: "Here's the BEO (Version 3, generated 29 Sep): https://www.croftcommontest.com/beo/view?f=..."

FOR COMMON KNOWLEDGE QUESTIONS:
- If documents are in RETRIEVED DATA, list them with their titles and links
- Quote relevant excerpts from the content preview
- Provide the full document link for detailed reading
- Mention the collection/folder if relevant
- Example: "I found our Health & Safety policy - here's the key point: [quote from content]. Full document: https://www.croftcommontest.com/management/common-knowledge/d/health-safety-policy"
- If multiple documents match, list them and offer to elaborate on any specific one

FOR SCHEDULE QUESTIONS:
- List times and activities from RETRIEVED DATA if available
- Format times in 24-hour UK format (e.g., 14:30)

FOR FEEDBACK QUESTIONS:
- If feedback data is in RETRIEVED DATA, provide statistics and insights
- Include average ratings, sentiment breakdown, and rating distribution
- Quote relevant comments from recent feedback when helpful
- Highlight trends (e.g., "Most feedback is positive with 4-5 star ratings")
- Example: "The event has an average rating of 4.5/5 based on 12 submissions. 75% rated it 5 stars. Recent feedback highlights: great food quality, excellent service."

FOR ACTIONS (When asked to DO something):
- Only return JSON when explicitly asked to CREATE, UPDATE, DELETE something
- Format: {"type": "action", "action": "action_name", "params": {...}, "reasoning": "why"}

**Response Examples:**
- "What's on the menu for the 28 Sep event?" → List actual dishes from RETRIEVED DATA
- "Send me the BEO for 2025002" → "Here's the BEO [link]"
- "What events are coming up?" → "You've got 2 events: [list from overview]"
- "Create a new event" → Return JSON action

**Keep in Mind:**
- Respect role permissions
- If event isn't clear, ask for clarification or offer recent events as choices
- Offer helpful next steps when appropriate

**Available Actions:**
${getAvailableActions(user?.role)}

**Current Page:**
${getPageContext(page)}
`;

  return prompt;
}

function getRolePermissions(role: string): string {
  const permissions = {
    admin: "Full access - Can create, edit, delete anything. Access to all financial data and audit logs.",
    sales: "Can create/edit events, leads, bookings. Can view finances. Cannot delete major records or access full audit logs.",
    ops: "Can view bookings/events, manage schedules, limited editing. Cannot access finances or create major records.",
    finance: "Can view financial data, audit logs, generate reports. Cannot create or modify events/bookings.",
    readonly: "View-only access across all modules. Cannot make any changes."
  };
  return permissions[role as keyof typeof permissions] || "Unknown role - limited access";
}

function getAvailableActions(role: string): string {
  const baseActions = "- Query data and generate reports\n- Search across modules\n- Display BEO details and provide PDF links";
  
  const actionsByRole: Record<string, string> = {
    admin: `${baseActions}
- create_venue, update_venue, delete_venue
- create_event, update_event, delete_event
- create_booking, update_booking, resolve_conflict
- generate_beo (create new BEO version with all details)
- update_beo_section (update menu, staffing, schedule, equipment, layouts)
- send_beo_email (email BEO to client/team)
- create_lead, assign_lead, update_lead_status
- generate_contract, send_contract
- generate_invoice
- run_analytics, export_report`,
    
    sales: `${baseActions}
- create_event, update_event
- create_booking, update_booking
- generate_beo (create new BEO version)
- update_beo_section (update BEO details)
- send_beo_email (email BEO to client/team)
- create_lead, assign_lead, update_lead_status
- generate_contract, send_contract
- generate_invoice`,
    
    ops: `${baseActions}
- update_booking (limited)
- generate_beo (create BEO version)
- update_beo_section (update operational details)
- send_beo_email (send to operations team)
- generate_report (operational)`,
    
    finance: `${baseActions}
- run_analytics, export_report (financial)
- generate_invoice`,
    
    readonly: baseActions
  };
  
  return actionsByRole[role] || baseActions;
}

function getPageContext(page: any): string {
  if (!page?.route) return "No specific page context";
  
  const contexts: Record<string, string> = {
    "/management": "Overview dashboard - Summary of all activities",
    "/management/spaces": "Spaces management - View and edit venues and spaces",
    "/management/calendar": "Calendar view - Check availability and conflicts",
    "/management/events": "Events management - View and manage event bookings",
    "/management/leads": "Leads & Sales - Manage sales pipeline",
  };
  
  return contexts[page.route] || `Viewing: ${page.route}`;
}
