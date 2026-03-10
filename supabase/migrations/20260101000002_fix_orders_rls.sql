-- 不具合修正: orders の UPDATE ポリシーに WITH CHECK を追加
-- USING のみだと WITH CHECK も同じ条件が適用され、
-- status='shipped' への更新が自己ブロックされていた

ALTER POLICY "認証済みユーザーはshipped前のオーダーを更新"
  ON orders
  USING (auth.uid() IS NOT NULL AND status != 'shipped')
  WITH CHECK (auth.uid() IS NOT NULL);
