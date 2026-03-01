import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
  useEdgesState,
  useNodesState,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { fetchEntries } from "../../../api/resources";
import type { EntryItem } from "../../../types/resource";

type GraphNodeData = {
  label: string;
  entryId: number;
  tags: string[];
};

function pickRoot(entries: EntryItem[]): EntryItem | null {
  if (entries.length === 0) return null;

  // Root = entry con más tags (o la primera si empate)
  // (alternativa: más reciente por createdAt)
  let best = entries[0];
  for (const e of entries) {
    const score = e.tags?.length ?? 0;
    const bestScore = best.tags?.length ?? 0;
    if (score > bestScore) best = e;
  }
  return best;
}

function buildGraphFromEntries(entries: EntryItem[]) {
  // 1) nodos
  const nodes: Node<GraphNodeData>[] = entries.map((e) => ({
    id: String(e.id),
    type: "default",
    position: { x: 0, y: 0 }, // lo calculamos luego
    data: {
      label: e.title || `Entry #${e.id}`,
      entryId: e.id,
      tags: (e.tags ?? []).map((t) => t.name),
    },
  }));

  // 2) edges por tags compartidos (optimizado: tag -> ids)
  const tagToEntryIds = new Map<string, number[]>();
  for (const e of entries) {
    for (const tag of e.tags ?? []) {
      const key = tag.name.trim().toLowerCase();
      if (!key) continue;
      const list = tagToEntryIds.get(key) ?? [];
      list.push(e.id);
      tagToEntryIds.set(key, list);
    }
  }

  // pares únicos (a,b) que comparten al menos un tag
  const pairToTags = new Map<string, string[]>(); // "a|b" -> [tag,...]
  for (const [tag, ids] of tagToEntryIds.entries()) {
    // evitar explosión si un tag tiene 2000 entries: cap (hackathon)
    const capped = ids.slice(0, 200);

    for (let i = 0; i < capped.length; i++) {
      for (let j = i + 1; j < capped.length; j++) {
        const a = capped[i];
        const b = capped[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        const tags = pairToTags.get(key) ?? [];
        tags.push(tag);
        pairToTags.set(key, tags);
      }
    }
  }

  const edges: Edge[] = [];
  for (const [pairKey, tags] of pairToTags.entries()) {
    const [a, b] = pairKey.split("|");
    edges.push({
      id: `e_${pairKey}`,
      source: a,
      target: b,
      // si quieres enseñar el tag en la línea:
      // label: tags.length === 1 ? tags[0] : `${tags[0]} +${tags.length - 1}`,
      // labelShowBg: true,
    });
  }

  return { nodes, edges };
}

function buildAdjacency(edges: Edge[]) {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const a = e.source;
    const b = e.target;
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  return adj;
}

function layoutBfsRings(
  nodes: Node[],
  edges: Edge[],
  rootId: string | null,
  radiusStep = 220
) {
  if (!rootId) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adj = buildAdjacency(edges);

  // BFS niveles
  const level = new Map<string, number>();
  const queue: string[] = [];
  level.set(rootId, 0);
  queue.push(rootId);

  while (queue.length) {
    const cur = queue.shift()!;
    const curLevel = level.get(cur)!;
    for (const nb of adj.get(cur) ?? []) {
      if (!level.has(nb)) {
        level.set(nb, curLevel + 1);
        queue.push(nb);
      }
    }
  }

  // los desconectados al final
  const maxLevel = Math.max(0, ...Array.from(level.values()));
  for (const n of nodes) {
    if (!level.has(n.id)) level.set(n.id, maxLevel + 1);
  }

  // agrupar por nivel
  const groups = new Map<number, string[]>();
  for (const [id, lv] of level.entries()) {
    groups.set(lv, [...(groups.get(lv) ?? []), id]);
  }

  // posiciones por anillo
  const positioned: Node[] = nodes.map((n) => ({ ...n }));
  for (const [lv, ids] of groups.entries()) {
    const r = lv * radiusStep;
    const count = ids.length;

    // para root (lv=0)
    if (lv === 0 && count === 1) {
      const node = byId.get(ids[0]);
      if (!node) continue;
      const idx = positioned.findIndex((x) => x.id === node.id);
      positioned[idx] = { ...positioned[idx], position: { x: 0, y: 0 } };
      continue;
    }

    const step = (2 * Math.PI) / Math.max(1, count);
    ids.forEach((id, i) => {
      const angle = i * step - Math.PI / 2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const idx = positioned.findIndex((x) => x.id === id);
      if (idx >= 0) positioned[idx] = { ...positioned[idx], position: { x, y } };
    });
  }

  return positioned;
}

export function RelationshipGraph() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await fetchEntries();
        if (!cancelled) setEntries(data);
      } catch (e) {
        if (!cancelled) setLoadError("No se pudieron cargar tus notas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { baseNodes, baseEdges, rootId } = useMemo(() => {
    const { nodes, edges } = buildGraphFromEntries(entries);
    const root = pickRoot(entries);
    const rootId = root ? String(root.id) : null;

    // layout “tipo árbol” (en anillos por BFS)
    const laidOut = layoutBfsRings(nodes, edges, rootId, 220);

    return { baseNodes: laidOut, baseEdges: edges, rootId };
  }, [entries]);

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  // Cuando cambian entries -> refrescar estados internos de ReactFlow
  useEffect(() => {
    setNodes(baseNodes);
    setEdges(baseEdges);
  }, [baseNodes, baseEdges, setNodes, setEdges]);

  // Click: centrar en el nodo
  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      if (!rf) return;
      rf.fitView({ nodes: [node], padding: 0.6, duration: 350 });
    },
    [rf]
  );

  // Centrar al cargar
  useEffect(() => {
    if (!rf) return;
    if (nodes.length === 0) return;
    rf.fitView({ padding: 0.25, duration: 350 });
  }, [rf, nodes.length]);

  return (
    <div className="w-full h-[calc(100vh-220px)] rounded-2xl overflow-hidden border border-white/40 bg-white/30 backdrop-blur">
      {loading ? (
        <div className="h-full grid place-items-center">
          <p className="text-sm font-semibold text-ink-700">Cargando grafo…</p>
        </div>
      ) : loadError ? (
        <div className="h-full grid place-items-center">
          <p className="text-sm font-semibold text-rose-700">{loadError}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="h-full grid place-items-center">
          <p className="text-sm font-semibold text-ink-700">Aún no tienes notas.</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={setRf}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          panOnScroll
          zoomOnScroll
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      )}
    </div>
  );
}