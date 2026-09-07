import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const routes = [
    {
        path: '/',
        name: 'Scene',
        component: () => import('@/views/Scene.vue')
    },
    {
        // Shared collection, "anyone with the link". Two segments on purpose so it
        // never collides with the single-segment catch-all `/:taskId` below.
        path: '/s/:token',
        name: 'PublicSky',
        component: () => import('@/views/PublicSky.vue'),
        props: true,
    },
    {
        path: '/:taskId',
        name: 'SceneDisplay',
        component: () => import('@/views/Scene.vue'),
        props: true,
    },
    {
        path: '/submissions',
        name: 'Submissions',
        component: () => import('@/views/Submissions.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/solve',
        name: 'Solve',
        component: () => import('@/views/Solve.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/solve/:taskId',
        name: 'SolveTask',
        component: () => import('@/views/Solve.vue'),
        meta: { requiresAuth: true },
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// `/s/:token` is a capability URL: the token is the credential. Keep it out of search
// engines and out of the Referer header of every request the page makes afterwards
// (tiles live on another origin). Set here, before the lazy route component is even
// fetched, and removed again on the way out so the rest of the app is unaffected.
const PUBLIC_META = { robots: 'noindex,nofollow', referrer: 'no-referrer' }

function applyPublicMeta(on) {
    for (const [name, content] of Object.entries(PUBLIC_META)) {
        let el = document.head.querySelector(`meta[name="${name}"][data-public-view]`)
        if (on) {
            if (!el) {
                el = document.createElement('meta')
                el.setAttribute('name', name)
                el.setAttribute('data-public-view', '')
                document.head.appendChild(el)
            }
            el.setAttribute('content', content)
        } else if (el) {
            el.remove()
        }
    }
}

router.beforeEach((to) => {
    applyPublicMeta(to.name === 'PublicSky')

    if (to.meta.requiresAuth) {
        const { getToken, login } = useAuth()
        if (!getToken()) {
            sessionStorage.setItem('auth_redirect', to.fullPath)
            login()
            return false
        }
    }
})

export default router
