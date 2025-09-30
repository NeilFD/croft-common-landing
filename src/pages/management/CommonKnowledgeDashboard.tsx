import { useState } from "react";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookOpen, Plus, Search, Pin, Clock, FileText, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommonKnowledgeDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ManagementLayout>
      <div className="space-y-6 p-3 md:p-6">
        <h1 className="text-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">COMMON KNOWLEDGE</h1>
        {/* Header with search and new doc button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, SOPs, policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/management/common-knowledge/new">
                <FileText className="h-4 w-4 mr-2" />
                New Document
              </Link>
            </Button>
            <Button asChild>
              <Link to="/management/common-knowledge/upload">
                <Plus className="h-4 w-4 mr-2" />
                Upload File
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                <FileText className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              </div>
              <div>
                <p className="text-2xl font-brutalist font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total Docs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                <Star className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              </div>
              <div>
                <p className="text-2xl font-brutalist font-bold">0</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                <Clock className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              </div>
              <div>
                <p className="text-2xl font-brutalist font-bold">0</p>
                <p className="text-sm text-muted-foreground">In Review</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                <Pin className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              </div>
              <div>
                <p className="text-2xl font-brutalist font-bold">0</p>
                <p className="text-sm text-muted-foreground">Pinned</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-brutalist font-bold">Recent Documents</h2>
          </div>
          
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-brutalist font-bold mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first document to start building your knowledge base
                </p>
                <Button asChild>
                  <Link to="/management/common-knowledge/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Document
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Pinned documents section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-brutalist font-bold">Pinned Documents</h2>
          </div>
          
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Pin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  Pin important documents for quick access
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ManagementLayout>
  );
}
