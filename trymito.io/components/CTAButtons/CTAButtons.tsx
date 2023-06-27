import Link from 'next/link';
import { MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import TextButton from '../TextButton/TextButton';
import ctaButtons from './CTAButtons.module.css'
import { classNames } from '../../utils/classNames';

const JUPYTERLITE_MITO_LINK = 'https://mito-ds.github.io/mitolite/lab?path=mito.ipynb';

const CTAButtons = (props: {
    variant: 'download' | 'contact' | 'try jupyterlite',
    align: 'left' | 'center'
}): JSX.Element => {

    return (
        <div className={classNames(
            ctaButtons.cta_buttons_container, 
            {[ctaButtons.center] : props.align === 'center'}
        )}> 
            {props.variant === 'download' && 
                <TextButton 
                    text='Install Mito'
                    href={MITO_INSTALLATION_DOCS_LINK}
                />
            }
            {props.variant === 'try jupyterlite' && 
                <div className={ctaButtons.multiple_button_container}>
                    <TextButton 
                        text='Try Mito'
                        href={JUPYTERLITE_MITO_LINK}
                    />
                    <a className={ctaButtons.product_hunt_button} href="https://www.producthunt.com/posts/mito-ai?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-mito&#0045;ai" target="_blank" rel="noreferrer"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=398626&theme=light" alt="Mito&#0032;AI - Automate&#0032;Excel&#0032;reports&#0032;with&#0032;AI | Product Hunt" width="250" height="54"/></a>
                </div>
            }
            {props.variant === 'contact' && 
                <TextButton 
                    text='Contact the Mito Team'
                    href="mailto:founders@sagacollab.com"
                />
            }
            
            <h2 className={ctaButtons.cta_subbutton}>
                <Link href='/plans'>
                    <a>
                        or see Pro plans →
                    </a>
                </Link>
            </h2>
        </div>
    )
}

export default CTAButtons;