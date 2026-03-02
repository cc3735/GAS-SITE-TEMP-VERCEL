import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';
import type { Database, ChartOfAccount, JournalEntry, JournalEntryItem } from '../types/database.js';

const router = Router();
router.use(authenticate);

// --- Chart of Accounts ---

const accountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
    account_number: z.string().optional(),
    description: z.string().optional(),
    balance: z.number().optional(),
});

// Get all accounts for a business
router.get('/:businessId/accounts', asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const { data, error } = await supabaseAdmin
        .from('chart_of_accounts')
        .select('*')
        .eq('business_id', businessId)
        .order('account_number');

    if (error) throw new Error(error.message);
    res.json({ success: true, data });
}));

// Create a new account
router.post('/:businessId/accounts', asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const validation = accountSchema.safeParse(req.body);
    if (!validation.success) throw new ValidationError(validation.error.message);

    const { name, type, account_number, description, balance } = validation.data;
    const { data, error } = await supabaseAdmin
        .from('chart_of_accounts')
        .insert({ business_id: businessId, name, type, account_number, description, balance })
        .select()
        .single<ChartOfAccount>();

    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
}));

// --- Journal Entries ---

const journalEntryItemSchema = z.object({
    account_id: z.string().uuid(),
    type: z.enum(['debit', 'credit']),
    amount: z.number().positive(),
    description: z.string().optional(),
});

const journalEntrySchema = z.object({
    date: z.string().pipe(z.coerce.date()),
    description: z.string().min(1),
    items: z.array(journalEntryItemSchema).min(2),
});

// Get all journal entries for a business
router.get('/:businessId/journal-entries', asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const { data, error } = await supabaseAdmin
        .from('journal_entries')
        .select('*, items:journal_entry_items(*)')
        .eq('business_id', businessId)
        .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ success: true, data });
}));

// Create a new journal entry
router.post('/:businessId/journal-entries', asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const validation = journalEntrySchema.safeParse(req.body);
    if (!validation.success) throw new ValidationError(validation.error.message);

    const { date, description, items } = validation.data;

    // TODO: Add validation to ensure debits === credits

    const { data: entry, error: entryError } = await supabaseAdmin
        .from('journal_entries')
        .insert({ business_id: businessId, date, description })
        .select()
        .single<JournalEntry>();

    if (entryError) throw new Error(entryError.message);

    const itemsWithEntryId = items.map(item => ({ ...item, journal_entry_id: entry.id }));
    const { data: newItems, error: itemsError } = await supabaseAdmin
        .from('journal_entry_items')
        .insert(itemsWithEntryId)
        .select();

    if (itemsError) throw new Error(itemsError.message);

    res.status(201).json({ success: true, data: { ...entry, items: newItems as JournalEntryItem[] } });
}));

export default router;
