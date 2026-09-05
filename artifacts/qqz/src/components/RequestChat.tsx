import { useEffect, useRef, useState } from "react";
import {
  getGetJobMessagesQueryKey,
  useCreateJobMessage,
  useGetJobMessages,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { cn, formatDate } from "@/lib/utils";

export function RequestChat({
  jobId,
  customerName,
  isParticipant,
}: {
  jobId: number;
  customerName?: string | null;
  isParticipant: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesQuery = useGetJobMessages(jobId, {
    query: {
      queryKey: getGetJobMessagesQueryKey(jobId),
      enabled: isParticipant,
      refetchInterval: 15000,
    },
  });
  const sendMessage = useCreateJobMessage({
    mutation: {
      onSuccess: () => {
        setBody("");
        queryClient.invalidateQueries({ queryKey: getGetJobMessagesQueryKey(jobId) });
      },
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesQuery.data?.length]);

  if (!isParticipant) return null;

  const messages = messagesQuery.data ?? [];

  return (
    <section className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle size={17} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Request chat</h2>
            <p className="text-[11px] text-muted-foreground">Visible to QQZ admins for safety</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => messagesQuery.refetch()}
          disabled={messagesQuery.isFetching}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
          aria-label="Refresh chat"
        >
          <RefreshCw size={15} className={cn(messagesQuery.isFetching && "animate-spin")} />
        </button>
      </div>

      <div ref={scrollRef} className="max-h-72 min-h-28 space-y-3 overflow-y-auto p-4">
        {messagesQuery.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading messages...</div>
        ) : messagesQuery.isError ? (
          <div className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
            Chat could not be loaded. Try refreshing.
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <UserAvatar brandFallback size="md" />
            <p className="text-sm font-medium text-foreground">Start the conversation</p>
            <p className="text-xs text-muted-foreground">
              Keep messages relevant to this request. Your public name is shown instead of your real name.
            </p>
          </div>
        ) : (
          messages.map(message => {
            const own = message.senderId === user?.id;
            return (
              <div key={message.id} className={cn("flex items-end gap-2", own && "justify-end")}>
                {!own && <UserAvatar name={message.senderPublicName} photoUrl={message.senderPhotoUrl} size="sm" />}
                <div className={cn(
                  "max-w-[78%] rounded-2xl px-3 py-2",
                  own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
                )}>
                  {!own && <p className="mb-0.5 text-[11px] font-semibold text-primary">{message.senderPublicName}</p>}
                  <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                  <p className={cn("mt-1 text-[10px]", own ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = body.trim();
          if (!trimmed || sendMessage.isPending) return;
          sendMessage.mutate({ id: jobId, data: { body: trimmed } });
        }}
      >
        <textarea
          value={body}
          onChange={event => setBody(event.target.value.slice(0, 2000))}
          placeholder="Write a message..."
          rows={1}
          className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label="Chat message"
        />
        <button
          type="submit"
          disabled={!body.trim() || sendMessage.isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
      {sendMessage.isError && (
        <p className="px-4 pb-3 text-xs text-destructive">Message could not be sent. Please try again.</p>
      )}
      <div className="flex items-center gap-1 border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
        <ShieldCheck size={12} className="text-primary" />
        QQZ admins may hide messages that violate marketplace safety rules.
      </div>
    </section>
  );
}