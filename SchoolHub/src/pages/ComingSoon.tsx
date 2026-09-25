import { PageHeader } from "../components/layout/PageHeader";
import { EmptyPanel } from "../components/common/EmptyPanel";

type ComingSoonProps = {
  title: string;
};

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} subtitle="This module is queued up next." />
      <EmptyPanel message="Nothing here yet." />
    </>
  );
}