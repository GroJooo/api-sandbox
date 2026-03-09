# Distributed Job Processing Sandbox (Node.js • BullMQ • Redis)

## 🎯 Vision & Objectif
Ce dépôt sert de laboratoire personnel pour valider des motifs d'architecture distribuée. L'enjeu est de démontrer la mise en œuvre d'un système de traitement asynchrone robuste, capable de gérer la montée en charge et de garantir l'intégrité des données en environnement de production.

En tant que Leader Technique, cette sandbox me permet de rester "hands-on" sur les problématiques de résilience que je supervise au niveau organisationnel.

## 🏗️ Architecture du Système
Le projet repose sur un couplage **Producer/Consumer** optimisé pour la scalabilité horizontale :

- **Runtime :** Node.js (TypeScript)
- **Orchestration :** BullMQ pour la gestion des files d'attente.
- **Persistence :** Redis (Backing store pour la queue et les états).
- **Monitoring :** Intégration de Bull Board pour la visibilité en temps réel des jobs.

```mermaid
graph LR
  A[API / Producer] -->|Push Job| B((Redis Queue))
  B -->|Fetch| C[Worker A]
  B -->|Fetch| D[Worker B]
  C -->|Result| E[(Storage/Logs)]
  D -->|Result| E
