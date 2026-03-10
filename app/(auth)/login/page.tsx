import { login } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>在庫管理システム</CardTitle>
        <CardDescription>メールアドレスとパスワードでログインしてください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={login} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <ErrorMessage searchParams={searchParams} />
          <Button type="submit" className="w-full">
            ログイン
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p className="text-sm text-destructive text-center">
      メールアドレスまたはパスワードが正しくありません
    </p>
  );
}
