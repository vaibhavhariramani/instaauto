import { Link } from 'react-router-dom';
import { Instagram, MessageSquarePlus, Text, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

const ACTIONS = [
  { to: ROUTES.automationNew, label: 'New automation', icon: Zap },
  { to: ROUTES.templates, label: 'New template', icon: Text },
  { to: ROUTES.instagram, label: 'Manage Instagram', icon: Instagram },
  { to: ROUTES.messages, label: 'View messages', icon: MessageSquarePlus },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <Button key={action.to} variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link to={action.to}>
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
