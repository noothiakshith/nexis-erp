import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  TrendingUp, 
  Award,
  Target
} from "lucide-react";

interface LeadScoringProps {
  lead: any;
}

export function LeadScoring({ lead }: LeadScoringProps) {
  // Calculate lead score based on various factors
  const calculateLeadScore = () => {
    let score = 0;
    
    // Company size factor
    if (lead.company) score += 20;
    
    // Contact information completeness
    if (lead.email) score += 15;
    if (lead.phone) score += 15;
    
    // Engagement level (based on status)
    switch (lead.status) {
      case "new":
        score += 10;
        break;
      case "contacted":
        score += 25;
        break;
      case "qualified":
        score += 40;
        break;
      case "proposal":
        score += 60;
        break;
      case "won":
        score += 100;
        break;
    }
    
    // Deal value factor
    const value = parseFloat(lead.value || "0");
    if (value > 100000) score += 30;
    else if (value > 50000) score += 20;
    else if (value > 10000) score += 10;
    
    return Math.min(score, 100);
  };

  const score = calculateLeadScore();

  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: "A", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { grade: "B", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 40) return { grade: "C", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { grade: "D", color: "text-red-600", bg: "bg-red-100" };
  };

  const scoreGrade = getScoreGrade(score);

  const getQualityLabel = (score: number) => {
    if (score >= 80) return "Hot Lead";
    if (score >= 60) return "Warm Lead";
    if (score >= 40) return "Cold Lead";
    return "Unqualified";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Lead Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${scoreGrade.color}`}>
                {score}
              </div>
              <div>
                <Badge className={`${scoreGrade.bg} ${scoreGrade.color} text-lg px-3 py-1`}>
                  Grade {scoreGrade.grade}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">{getQualityLabel(score)}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Award className={`h-12 w-12 ${scoreGrade.color}`} />
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Lead Quality</span>
            <span className="text-sm text-gray-600">{score}/100</span>
          </div>
          <Progress value={score} className="h-3" />
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Score Factors</h4>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Contact Information</span>
            <Badge variant="outline" className="text-xs">
              {(lead.email ? 15 : 0) + (lead.phone ? 15 : 0)}/30
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Company Details</span>
            <Badge variant="outline" className="text-xs">
              {lead.company ? 20 : 0}/20
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Engagement Level</span>
            <Badge variant="outline" className="text-xs">
              {lead.status === "won" ? 100 : lead.status === "proposal" ? 60 : lead.status === "qualified" ? 40 : lead.status === "contacted" ? 25 : 10}/100
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Deal Value</span>
            <Badge variant="outline" className="text-xs">
              {parseFloat(lead.value || "0") > 100000 ? 30 : parseFloat(lead.value || "0") > 50000 ? 20 : parseFloat(lead.value || "0") > 10000 ? 10 : 0}/30
            </Badge>
          </div>
        </div>

        {/* Recommendations */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1">Recommendation</h4>
              <p className="text-xs text-gray-600">
                {score >= 80 && "High priority lead! Schedule a meeting immediately."}
                {score >= 60 && score < 80 && "Good potential. Follow up with personalized outreach."}
                {score >= 40 && score < 60 && "Needs nurturing. Add to email campaign."}
                {score < 40 && "Low priority. Focus on higher-scoring leads first."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
