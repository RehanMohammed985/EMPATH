"use client";

import Avvvatars from "avvvatars-react";

function MyAvatar({ value }: { value: string }) {
  return (
    <div style={{ width: 40, height: 40 }}>
      <Avvvatars value={value} style="shape" />
    </div>
  );
}

type Props = {
  role: string;
  content: string;
};

export default function CharacterMessage({ role, content }: Props) {
  return (
    <div className="d-flex align-items-start gap-3 my-4">
      <MyAvatar value={role} />
      <div>
        <div className="fw-bold">{role}</div>
        <div className="bg-secondary text-white px-3 py-2 rounded">
          <div className="mt-1 text-break">{content}</div>
        </div>
      </div>
    </div>
  );
}
