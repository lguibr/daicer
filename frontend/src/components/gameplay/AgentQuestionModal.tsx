/**
 * Agent Question Modal
 * Displays when the AI agent asks the user for clarification
 * Part of human-in-the-loop interaction
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Textarea from '@/components/ui/textarea';
import useSocket from '@/hooks/useSocket';
import { useI18n } from '@/i18n';

export interface AgentQuestion {
  questionId: string;
  question: string;
  context?: string;
  askedAt: number;
  askedBy: 'dm' | 'system' | 'combat';
}

interface AgentQuestionModalProps {
  question: AgentQuestion;
  roomId: string;
  onClose: () => void;
}

export function AgentQuestionModal({ question, roomId, onClose }: AgentQuestionModalProps) {
  const { t } = useI18n();
  const { socket } = useSocket();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim() || !socket) return;

    setIsSubmitting(true);

    try {
      // Emit answer via socket
      socket.emit('agent:answer', {
        roomId,
        questionId: question.questionId,
        answer: answer.trim(),
        userId: socket.id, // Will be replaced with actual user ID on backend
      });

      // Close modal after submission
      onClose();
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setIsSubmitting(false);
    }
  };

  const getAskerLabel = () => {
    switch (question.askedBy) {
      case 'dm':
        return t('gameplay.agent.askedByDM') || 'Dungeon Master';
      case 'combat':
        return t('gameplay.agent.askedByCombat') || 'Combat System';
      case 'system':
        return t('gameplay.agent.askedBySystem') || 'Game System';
      default:
        return t('gameplay.agent.askedByAgent') || 'AI Agent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 border-aurora-blue shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🤔</span>
            {t('gameplay.agent.questionTitle') || 'The DM has a question'}
          </CardTitle>
          <CardDescription>
            {t('gameplay.agent.askedBy') || 'Asked by'}: <strong>{getAskerLabel()}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Question */}
          <div className="p-4 bg-muted rounded-lg border-l-4 border-aurora-blue">
            <p className="text-lg font-medium">{question.question}</p>
          </div>

          {/* Context (if provided) */}
          {question.context && (
            <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
              <strong>{t('gameplay.agent.context') || 'Context'}:</strong> {question.context}
            </div>
          )}

          {/* Answer Input */}
          <div className="space-y-2">
            <label htmlFor="agent-answer" className="text-sm font-medium">
              {t('gameplay.agent.yourAnswer') || 'Your answer'}
            </label>
            <Textarea
              id="agent-answer"
              value={answer}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
              placeholder={t('gameplay.agent.answerPlaceholder') || 'Type your answer here...'}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!answer.trim() || isSubmitting}>
            {isSubmitting
              ? t('gameplay.agent.submitting') || 'Submitting...'
              : t('gameplay.agent.submitAnswer') || 'Submit Answer'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
