/**
 * Real ML Lead Scoring Component
 * Uses Logistic Regression trained on historical conversion data
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { Brain, Users, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function RealMLLeadScoring() {
  const [leadData, setLeadData] = useState({
    engagementScore: 75,
    companySize: 250,
    industryScore: 4,
    interactionCount: 10,
    emailOpenRate: 65,
    websiteVisits: 8,
    demoRequested: 1,
    budgetRange: 50000,
    decisionMaker: 1,
    responseTime: 24
  });

  const statusQuery = trpc.mlReal.getTrainingStatus.useQuery();
  const scoreMutation = trpc.mlReal.scoreLead.useMutation();

  const handleScoreLead = () => {
    scoreMutation.mutate(leadData);
  };

  const leadScoringStatus = statusQuery.data?.leadScoring;
  const result = scoreMutation.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Real ML Lead Scoring
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Logistic Regression trained on conversion data
        </p>
      </div>

      {/* Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Model Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Training Status</p>
              <p className="font-medium">
                {leadScoringStatus?.trained ? 'Model Trained' : 'Not Trained'}
              </p>
            </div>
            <Badge variant={leadScoringStatus?.trained ? 'default' : 'secondary'}>
              {leadScoringStatus?.info?.features || 0} Features
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Features</CardTitle>
          <CardDescription>Adjust values to see ML prediction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Engagement Score (0-100)</Label>
              <Input
                type="number"
                value={leadData.engagementScore}
                onChange={(e) =>
                  setLeadData({ ...leadData, engagementScore: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Company Size</Label>
              <Input
                type="number"
                value={leadData.companySize}
                onChange={(e) =>
                  setLeadData({ ...leadData, companySize: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Industry Score (1-5)</Label>
              <Input
                type="number"
                value={leadData.industryScore}
                onChange={(e) =>
                  setLeadData({ ...leadData, industryScore: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Interaction Count</Label>
              <Input
                type="number"
                value={leadData.interactionCount}
                onChange={(e) =>
                  setLeadData({ ...leadData, interactionCount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Email Open Rate (%)</Label>
              <Input
                type="number"
                value={leadData.emailOpenRate}
                onChange={(e) =>
                  setLeadData({ ...leadData, emailOpenRate: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Website Visits</Label>
              <Input
                type="number"
                value={leadData.websiteVisits}
                onChange={(e) =>
                  setLeadData({ ...leadData, websiteVisits: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Budget Range ($)</Label>
              <Input
                type="number"
                value={leadData.budgetRange}
                onChange={(e) =>
                  setLeadData({ ...leadData, budgetRange: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Response Time (hours)</Label>
              <Input
                type="number"
                value={leadData.responseTime}
                onChange={(e) =>
                  setLeadData({ ...leadData, responseTime: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={leadData.demoRequested === 1}
                onChange={(e) =>
                  setLeadData({ ...leadData, demoRequested: e.target.checked ? 1 : 0 })
                }
                className="rounded"
              />
              <Label>Demo Requested</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={leadData.decisionMaker === 1}
                onChange={(e) =>
                  setLeadData({ ...leadData, decisionMaker: e.target.checked ? 1 : 0 })
                }
                className="rounded"
              />
              <Label>Decision Maker</Label>
            </div>
          </div>

          <Button
            onClick={handleScoreLead}
            disabled={!leadScoringStatus?.trained || scoreMutation.isPending}
            className="w-full"
          >
            {scoreMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scoring...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Score Lead with ML
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              ML Prediction Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Conversion Probability */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversion Probability</span>
                <Badge
                  variant={
                    result.category === 'hot'
                      ? 'default'
                      : result.category === 'warm'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="text-lg px-3 py-1"
                >
                  {result.category.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2">
                <Progress value={result.probability * 100} className="h-3" />
                <p className="text-3xl font-bold text-purple-600">
                  {(result.probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Model Confidence</span>
                <span className="text-sm text-muted-foreground">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={result.confidence * 100} className="h-2" />
            </div>

            {/* Interpretation */}
            <div className="p-4 bg-white rounded-lg border">
              <p className="text-sm font-semibold mb-2">Interpretation:</p>
              <p className="text-sm text-muted-foreground">
                {result.probability >= 0.7
                  ? '🔥 High conversion probability! Prioritize immediate follow-up with senior sales rep.'
                  : result.probability >= 0.4
                  ? '⚡ Moderate conversion probability. Continue nurturing with personalized content.'
                  : '📧 Low conversion probability. Add to drip campaign and monitor engagement.'}
              </p>
            </div>

            {/* Technical Details */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-white rounded border">
              <p className="font-semibold">Technical Details:</p>
              <p>• Algorithm: Logistic Regression (Sigmoid Activation)</p>
              <p>• Features: 10 dimensions</p>
              <p>• Training: Binary classification on historical conversions</p>
              <p>• Output: Probability score (0-1)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
