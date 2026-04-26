'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Star, Zap, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiGetRecommendations, type Recommendation } from '@/lib/api';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function CourseMatchPage() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [source, setSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !level) return;

    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const result = await apiGetRecommendations(topic.trim(), level);
      // Handle both array and object responses from the API
      const recs = Array.isArray(result.recommendations)
        ? result.recommendations
        : [];
      setRecommendations(recs);
      setSource(result.source);
    } catch (e) {
      setError('An error occurred while generating recommendations. Please check that the backend is running.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <Sparkles className="mx-auto h-12 w-12 text-accent mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
          AI Course Match
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Tell us your topic of interest and skill level. Our AI will suggest the best courses for you.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-base font-semibold">Topic / Subject</Label>
              <Input
                id="topic"
                placeholder="e.g. Machine Learning, Web Development, Data Science..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level" className="text-base font-semibold">Skill Level</Label>
              <Select value={level} onValueChange={setLevel} required>
                <SelectTrigger id="level" className="w-full">
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-accent"
              onClick={() => { setTopic('Machine Learning'); setLevel('Beginner'); }}
            >
              Try an example
            </Button>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !topic.trim() || !level} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Find My Courses
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <div className="mt-8 text-center text-destructive bg-destructive/10 p-4 rounded-md">
          {error}
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-headline text-3xl font-bold text-primary">Recommended Courses</h2>
            {source && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {source === 'gemini' ? 'Powered by Gemini AI' : 'Demo recommendations'}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-headline text-xl">{rec.title}</CardTitle>
                    <Badge className="bg-accent text-accent-foreground flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3" />
                      #{index + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <div className="border-l-2 border-accent pl-3">
                    <p className="text-sm">
                      <span className="font-semibold text-primary">Why this course: </span>
                      <span className="text-muted-foreground">{rec.matchReason}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recommendations && recommendations.length === 0 && !isLoading && (
        <div className="mt-8 text-center text-muted-foreground bg-muted/30 p-8 rounded-md">
          No recommendations found. Try a different topic or skill level.
        </div>
      )}
    </div>
  );
}
