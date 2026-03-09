  const userRepository = require('../repositories/user.repository');
  const { MAX_PAGE_LIMIT, DEFAULT_PAGE, DEFAULT_LIMIT } = require('../config/environment');
  const { getRedisClient } = require('../config/redis');


  /**
   * Invalide tous les caches de liste d'utilisateurs
   */
  const invalidateUsersListCache = async () => {
    try {
      const redis = getRedisClient();

      // Trouver toutes les clés qui commencent par "users:list:"
      const keys = await redis.keys('users:list:*');

      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache invalidé: ${keys.length} clés supprimées`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'invalidation du cache:', err.message);
      // Continuer même si l'invalidation échoue
    }
  };

 /**
   * Invalide le cache d'un utilisateur spécifique
   */
  const invalidateUserCache = async (userId) => {
    try {
      const redis = getRedisClient();
      const key = `users:id:${userId}`;
      await redis.del(key);
      console.log(`Cache invalidé pour user: ${userId}`);
    } catch (err) {
      console.error('Erreur lors de l\'invalidation du cache user:', err.message);
    }
  };

  const create = async (data) => {
    const user = await userRepository.create(data);

    // Invalider le cache de la liste
    await invalidateUsersListCache();

    return user;
  };

  const getAll = async (query) => {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const sort = query.sort || '-createdAt';

    // Créer une clé de cache unique basée sur les paramètres
    const cacheKey = `users:list:page:${page}:limit:${limit}:sort:${sort}`;

    try {
      const redis = getRedisClient();

      // 1. Vérifier le cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`Cache hit pour: ${cacheKey}`);
        return JSON.parse(cached);
      }

      console.log(`Cache miss pour: ${cacheKey}`);
    } catch (err) {
      console.error('Erreur Redis (get):', err.message);
      // Continuer sans cache si Redis est down
    }

    // 2. Cache miss → lire la DB
    const [total, users] = await Promise.all([
      userRepository.count(),
      userRepository.findAll({ page, limit, sort })
    ]);

    const result = {
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: users
    };

    // 3. Mettre en cache pour 5 minutes (300 secondes)
    try {
      const redis = getRedisClient();
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
      console.log(`Mis en cache: ${cacheKey}`);
    } catch (err) {
      console.error('Erreur Redis (set):', err.message);
      // Continuer même si la mise en cache échoue
    }

    return result;
  };

  const getById = async (id) => {
    const cacheKey = `users:id:${id}`;

    try {
      const redis = getRedisClient();

      // 1. Vérifier le cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`Cache hit pour user: ${id}`);
        return JSON.parse(cached);
      }

      console.log(`Cache miss pour user: ${id}`);
    } catch (err) {
      console.error('Erreur Redis (get user):', err.message);
    }

    // 2. Cache miss → lire la DB
    const user = await userRepository.findById(id);

    // 3. Mettre en cache pour 5 minutes
    if (user) {
      try {
        const redis = getRedisClient();
        await redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
        console.log(`Mis en cache user: ${id}`);
      } catch (err) {
        console.error('Erreur Redis (set user):', err.message);
      }
    }

    return user;
  };

  const update = async (id, data) => {
    const user = await userRepository.update(id, data);

    // Invalider le cache du user spécifique
    await invalidateUserCache(id);
    
    // Invalider le cache de la liste
    await invalidateUsersListCache();

    return user;
  };

  const remove = async (id) => {
    const user = await userRepository.remove(id);

    // Invalider le cache du user spécifique
    await invalidateUserCache(id);
    
    // Invalider le cache de la liste
    await invalidateUsersListCache();

    return user;
  };

  const getStats = async () => {
    return userRepository.getStats();
  };
  
  const transfertPoints = async (senderId, receiverId, amount) => {
    if (amount <= 0) {
      const err = new Error('Le montant doit être positif');
      err.code = 'INVALID_AMOUNT';
      throw err;
    }
    if (senderId === receiverId) {
      const err = new Error('Le sender et le receiver ne peuvent pas être le même');
      err.code = 'SAME_USER';
      throw err;
    }

    const sender = await userRepository.findPointsById(senderId);
    if (!sender) {
      const err = new Error('Le sender n\'existe pas');
      err.code = 'SENDER_NOT_FOUND';
      throw err;
    }
    if ((sender.points ?? 0) < amount) {
      const err = new Error('Le sender n\'a pas assez de points');
      err.code = 'INSUFFICIENT_POINTS';
      throw err;
    }

    const receiver = await userRepository.findPointsById(receiverId);
    if (!receiver) {
      const err = new Error('Le receiver n\'existe pas');
      err.code = 'RECEIVER_NOT_FOUND';
      throw err;
    }

    await userRepository.updatePoints(senderId, -amount);
    await userRepository.updatePoints(receiverId, amount);
    await invalidateUserCache(senderId);
    await invalidateUserCache(receiverId);
    return { success: true, message: 'Points transférés avec succès', senderId, receiverId, amount };
  }


  module.exports = { create, getAll, getById, update, remove, getStats, transfertPoints };