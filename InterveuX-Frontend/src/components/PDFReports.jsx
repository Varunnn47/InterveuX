import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, TrendingUp, Award, Code } from 'lucide-react';

const PDFReports = () => {
  const [reportType, setReportType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState('last30days');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = {
    comprehensive: {
      name: 'Comprehensive Report',
      description: 'Complete analysis including all interviews, coding sessions, and performance metrics',
      icon: <FileText className="h-5 w-5" />
    },
    interview: {
      name: 'Interview Performance',
      description: 'Detailed interview analysis with feedback and improvement suggestions',
      icon: <Award className="h-5 w-5" />
    },
    coding: {
      name: 'Coding Assessment',
      description: 'Programming skills analysis with code quality metrics',
      icon: <Code className="h-5 w-5" />
    },
    progress: {
      name: 'Progress Tracking',
      description: 'Performance trends and skill development over time',
      icon: <TrendingUp className="h-5 w-5" />
    }
  };

  const dateRanges = {
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    last3months: 'Last 3 Months',
    last6months: 'Last 6 Months',
    lastyear: 'Last Year',
    all: 'All Time'
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: reportType,
          dateRange: dateRange,
          format: 'pdf'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewData = {
    comprehensive: {
      sections: ['Executive Summary', 'Interview Performance', 'Coding Skills', 'Skill Gaps', 'Recommendations'],
      metrics: ['Overall Score: 85%', 'Interviews: 12', 'Coding Sessions: 28', 'Improvement: +15%']
    },
    interview: {
      sections: ['Interview History', 'Performance Trends', 'Feedback Analysis', 'Improvement Areas'],
      metrics: ['Avg Score: 78%', 'Best Performance: 92%', 'Communication: 85%', 'Technical: 72%']
    },
    coding: {
      sections: ['Language Proficiency', 'Problem Solving', 'Code Quality', 'Algorithm Skills'],
      metrics: ['Languages: 5', 'Problems Solved: 156', 'Code Quality: 82%', 'Efficiency: 76%']
    },
    progress: {
      sections: ['Performance Timeline', 'Skill Development', 'Achievement Milestones', 'Future Goals'],
      metrics: ['Growth Rate: +23%', 'Consistency: 89%', 'Achievements: 8', 'Active Days: 45']
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Reports Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRanges).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {reportTypes[reportType].icon}
                {reportTypes[reportType].name}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {reportTypes[reportType].description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Report Sections</h4>
                  <ul className="space-y-1">
                    {previewData[reportType].sections.map((section, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Metrics</h4>
                  <div className="space-y-2">
                    {previewData[reportType].metrics.map((metric, index) => (
                      <Badge key={index} variant="outline" className="block w-fit">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="w-full flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generating Report...' : 'Generate PDF Report'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Comprehensive Report - December 2024', date: '2024-12-15', size: '2.3 MB' },
              { name: 'Coding Assessment - November 2024', date: '2024-11-30', size: '1.8 MB' },
              { name: 'Interview Performance - November 2024', date: '2024-11-15', size: '1.2 MB' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">{report.date} • {report.size}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFReports;