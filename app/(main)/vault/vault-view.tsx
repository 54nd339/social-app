'use client';

import { useState } from 'react';
import { FileText, Link as LinkIcon, Lock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { createVaultItem, deleteVaultItem } from '@/lib/actions/vault.actions';
import { decrypt, encrypt, generateEncryptionKey } from '@/lib/crypto';
import type { VaultItemRow } from '@/lib/db/queries/vault.queries';
import { formatRelativeTime } from '@/lib/utils';

const VAULT_KEY_STORAGE = 'haven-vault-key';

function getOrCreateVaultKey(): Promise<string> {
  const stored = localStorage.getItem(VAULT_KEY_STORAGE);
  if (stored) return Promise.resolve(stored);

  return generateEncryptionKey().then((key) => {
    localStorage.setItem(VAULT_KEY_STORAGE, key);
    return key;
  });
}

async function fetchVaultItems(): Promise<VaultItemRow[]> {
  const res = await fetch('/api/vault');
  if (!res.ok) throw new Error('Failed to fetch vault');
  return res.json();
}

interface DecryptedItem {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  note: FileText,
  link: LinkIcon,
};

export function VaultView() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'note' | 'link'>('note');
  const { data: items, isLoading } = useQuery({
    queryKey: ['vault'],
    queryFn: fetchVaultItems,
  });

  const { data: decryptedItems = [], isLoading: isDecrypting } = useQuery({
    queryKey: ['vault-decrypted', items?.map((i) => i.id).join(',')],
    queryFn: async () => {
      if (!items || items.length === 0) return [];
      const key = await getOrCreateVaultKey();
      return Promise.all(
        items.map(async (item): Promise<DecryptedItem> => {
          try {
            const plaintext = await decrypt(item.encryptedContent, key);
            return { id: item.id, content: plaintext, type: item.type, createdAt: item.createdAt };
          } catch {
            return {
              id: item.id,
              content: '[Unable to decrypt]',
              type: item.type,
              createdAt: item.createdAt,
            };
          }
        }),
      );
    },
    enabled: !!items,
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const key = await getOrCreateVaultKey();
      const encryptedContent = await encrypt(content, key);
      return createVaultItem({ encryptedContent, encryptedKey: 'local', type });
    },
    onSuccess: () => {
      setOpen(false);
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      toast.success('Saved to vault');
    },
    onError: () => toast.error('Failed to save'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteVaultItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      toast.success('Removed from vault');
    },
  });

  if (isLoading || isDecrypting) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="border-primary/20 bg-primary/5 text-muted-foreground flex items-center gap-2 rounded-lg border p-3 text-xs">
        <Lock className="text-primary size-4 shrink-0" />
        <span>Content is encrypted client-side. Your key never leaves this device.</span>
      </div>

      {decryptedItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Lock className="text-muted-foreground/40 size-10" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Your vault is empty</h3>
            <p className="text-muted-foreground text-xs">
              Add private notes and links that only you can see
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {decryptedItems.map((item) => {
          const Icon = TYPE_ICONS[item.type] ?? FileText;
          return (
            <div key={item.id} className="group flex items-start gap-3 rounded-lg border p-3">
              <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm break-words whitespace-pre-wrap">{item.content}</p>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 opacity-0 group-hover:opacity-100"
                onClick={() => remove(item.id)}
              >
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            Add to vault
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New vault item</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (content.trim()) save();
            }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'note' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('note')}
              >
                Note
              </Button>
              <Button
                type="button"
                variant={type === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('link')}
              >
                Link
              </Button>
            </div>

            <div className="space-y-1">
              <Label>{type === 'note' ? 'Note' : 'URL'}</Label>
              {type === 'note' ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something private..."
                  rows={4}
                />
              ) : (
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              )}
            </div>

            <Button type="submit" disabled={!content.trim() || isSaving} className="w-full">
              Encrypt & save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
